package com.subsflow.dunning.service;

import com.subsflow.billing.entity.Invoice;
import com.subsflow.billing.entity.InvoiceStatus;
import com.subsflow.billing.repository.InvoiceRepository;
import com.subsflow.common.context.TenantContext;
import com.subsflow.common.entity.OutboxEvent;
import com.subsflow.common.entity.OutboxEventStatus;
import com.subsflow.common.repository.OutboxEventRepository;
import com.subsflow.dunning.entity.PaymentRetryQueue;
import com.subsflow.dunning.entity.RetryStatus;
import com.subsflow.dunning.repository.PaymentRetryQueueRepository;
import com.subsflow.payment.entity.PaymentStatus;
import com.subsflow.payment.entity.PaymentTransaction;
import com.subsflow.payment.service.PaymentService;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.entity.SubscriptionStatus;
import com.subsflow.subscription.repository.SubscriptionRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@EnableScheduling
public class DunningScheduler {

    private static final Logger log = LoggerFactory.getLogger(DunningScheduler.class);
    private static final int MAX_RETRIES = 3;

    private final TenantRepository tenantRepository;
    private final PaymentRetryQueueRepository retryQueueRepository;
    private final PaymentService paymentService;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final com.subsflow.common.metrics.MetricsService metricsService;

    public DunningScheduler(TenantRepository tenantRepository,
                            PaymentRetryQueueRepository retryQueueRepository,
                            PaymentService paymentService,
                            SubscriptionRepository subscriptionRepository,
                            InvoiceRepository invoiceRepository,
                            OutboxEventRepository outboxEventRepository,
                            ObjectMapper objectMapper,
                            com.subsflow.common.metrics.MetricsService metricsService) {
        this.tenantRepository = tenantRepository;
        this.retryQueueRepository = retryQueueRepository;
        this.paymentService = paymentService;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.metricsService = metricsService;
    }

    @Scheduled(fixedDelay = 5000)
    public void processDunningQueue() {
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            try {
                processTenantRetries(tenant.getId());
            } catch (Exception e) {
                log.error("Error processing dunning retries for tenant: {}", tenant.getId(), e);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processTenantRetries(String tenantId) {
        try {
            TenantContext.setTenantId(tenantId);
            OffsetDateTime now = OffsetDateTime.now();
            List<PaymentRetryQueue> pendingRetries = retryQueueRepository.findPendingRetries(now);

            if (pendingRetries.isEmpty()) {
                return;
            }

            log.info("Processing {} pending dunning retries for tenant: {}", pendingRetries.size(), tenantId);

            for (PaymentRetryQueue retry : pendingRetries) {
                PaymentTransaction oldTx = retry.getTransaction();
                Subscription subscription = oldTx.getSubscription();
                Invoice invoice = oldTx.getInvoice();

                // If invoice is already paid, complete this queue item
                if (invoice.getStatus() == InvoiceStatus.PAID) {
                    retry.setStatus(RetryStatus.COMPLETED);
                    retryQueueRepository.save(retry);
                    continue;
                }

                log.info("Dunning execution: Attempt {} for invoice {}", retry.getRetryCount() + 1, invoice.getId());

                // Generate new unique idempotency key for this retry attempt
                String retryIdempotencyKey = "retry_" + invoice.getId() + "_" + retry.getRetryCount();
                
                // Process the retry payment. We default to standard mock payment method or retry original.
                String pmId = oldTx.getIdempotencyKey() != null ? "pm_retry_card" : "pm_default";
                metricsService.incrementDunningRetry();
                PaymentTransaction newTx = paymentService.processPayment(subscription, invoice, pmId, retryIdempotencyKey);

                if (newTx.getStatus() == PaymentStatus.SUCCESS) {
                    retry.setStatus(RetryStatus.COMPLETED);
                    retryQueueRepository.save(retry);
                    
                    subscription.setStatus(SubscriptionStatus.ACTIVE);
                    subscriptionRepository.save(subscription);
                    log.info("Dunning succeeded! Invoice {} paid on attempt {}", invoice.getId(), retry.getRetryCount() + 1);
                } else {
                    int attempts = retry.getRetryCount() + 1;
                    retry.setRetryCount(attempts);

                    if (attempts >= MAX_RETRIES) {
                        retry.setStatus(RetryStatus.FAILED);
                        retryQueueRepository.save(retry);

                        // Suspend Subscription
                        subscription.setStatus(SubscriptionStatus.SUSPENDED);
                        subscriptionRepository.save(subscription);

                        // Write Outbox Event for suspension
                        writeOutboxEvent("subscription.changed", Map.of(
                                "subscriptionId", subscription.getId(),
                                "oldPlanId", subscription.getPlan().getId(),
                                "newPlanId", subscription.getPlan().getId(),
                                "status", SubscriptionStatus.SUSPENDED.name(),
                                "reason", "Dunning max retries exceeded"
                        ));
                        log.warn("Dunning failed! Max retries exceeded. Subscription {} SUSPENDED", subscription.getId());
                    } else {
                        // Exponential backoff: retry in 2 minutes * attempt count
                        retry.setNextRetryAt(OffsetDateTime.now().plusMinutes(2L * attempts));
                        retry.setStatus(RetryStatus.PENDING);
                        retryQueueRepository.save(retry);
                        log.info("Dunning retry failed. Rescheduling attempt {} for {}", attempts + 1, retry.getNextRetryAt());
                    }
                }
            }
        } finally {
            TenantContext.clear();
        }
    }

    private void writeOutboxEvent(String eventType, Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            OutboxEvent event = new OutboxEvent();
            event.setId("evt_" + UUID.randomUUID().toString().substring(0, 8));
            event.setEventType(eventType);
            event.setPayload(jsonPayload);
            event.setStatus(OutboxEventStatus.PENDING);
            outboxEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to write outbox event", e);
        }
    }
}
