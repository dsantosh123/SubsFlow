package com.subsflow.billing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.billing.entity.*;
import com.subsflow.billing.repository.InvoiceLineItemRepository;
import com.subsflow.billing.repository.InvoiceRepository;
import com.subsflow.billing.repository.UsageEventRepository;
import com.subsflow.common.entity.OutboxEvent;
import com.subsflow.common.entity.OutboxEventStatus;
import com.subsflow.common.repository.OutboxEventRepository;
import com.subsflow.payment.entity.PaymentStatus;
import com.subsflow.payment.entity.PaymentTransaction;
import com.subsflow.payment.service.PaymentService;
import com.subsflow.subscription.entity.BillingPlan;
import com.subsflow.subscription.entity.BillingType;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.entity.SubscriptionStatus;
import com.subsflow.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingCycleServiceImpl implements BillingCycleService {

    private static final Logger log = LoggerFactory.getLogger(BillingCycleServiceImpl.class);

    private final SubscriptionRepository subscriptionRepository;
    private final UsageEventRepository usageEventRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final PaymentService paymentService;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public BillingCycleServiceImpl(SubscriptionRepository subscriptionRepository,
                                   UsageEventRepository usageEventRepository,
                                   InvoiceRepository invoiceRepository,
                                   InvoiceLineItemRepository invoiceLineItemRepository,
                                   PaymentService paymentService,
                                   OutboxEventRepository outboxEventRepository,
                                   ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.usageEventRepository = usageEventRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineItemRepository = invoiceLineItemRepository;
        this.paymentService = paymentService;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void billDueSubscriptions(String tenantId) {
        OffsetDateTime now = OffsetDateTime.now();
        List<Subscription> dueSubscriptions = subscriptionRepository.findDueSubscriptions(now);

        if (dueSubscriptions.isEmpty()) {
            return;
        }

        log.info("Found {} due subscriptions for tenant: {}", dueSubscriptions.size(), tenantId);

        for (Subscription subscription : dueSubscriptions) {
            try {
                billSubscription(subscription);
            } catch (Exception e) {
                log.error("Error billing subscription: {}", subscription.getId(), e);
            }
        }
    }

    private void billSubscription(Subscription subscription) {
        BillingPlan plan = subscription.getPlan();
        OffsetDateTime periodStart = subscription.getCurrentPeriodStart();
        OffsetDateTime periodEnd = subscription.getCurrentPeriodEnd();

        log.info("Billing subscription: {} on plan: {} for period {} to {}",
                subscription.getId(), plan.getName(), periodStart, periodEnd);

        // Calculate total invoice amount
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Create draft invoice
        Invoice invoice = new Invoice();
        invoice.setId("inv_" + UUID.randomUUID().toString().substring(0, 8));
        invoice.setSubscription(subscription);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setDueDate(OffsetDateTime.now().plusDays(7));
        invoice.setAmount(BigDecimal.ZERO); // Will update after line items
        invoiceRepository.save(invoice);

        // Line Item 1: Flat fee (for FIXED or TIERED plans)
        if (plan.getBillingType() == BillingType.FIXED || plan.getBillingType() == BillingType.TIERED) {
            InvoiceLineItem flatItem = new InvoiceLineItem();
            flatItem.setId("ili_" + UUID.randomUUID().toString().substring(0, 8));
            flatItem.setInvoice(invoice);
            flatItem.setPlan(plan);
            flatItem.setType(InvoiceLineItemType.FLAT);
            flatItem.setAmount(plan.getPrice());
            flatItem.setDescription("Monthly subscription: " + plan.getName());
            invoiceLineItemRepository.save(flatItem);
            totalAmount = totalAmount.add(plan.getPrice());
        }

        // Line Item 2: Usage aggregation (for USAGE_BASED plans)
        if (plan.getBillingType() == BillingType.USAGE_BASED) {
            BigDecimal totalUsage = usageEventRepository.sumUsageForPeriod(
                    subscription.getId(), periodStart, periodEnd);

            BigDecimal usageCost = totalUsage.multiply(plan.getPrice()).setScale(4, RoundingMode.HALF_UP);

            InvoiceLineItem usageItem = new InvoiceLineItem();
            usageItem.setId("ili_" + UUID.randomUUID().toString().substring(0, 8));
            usageItem.setInvoice(invoice);
            usageItem.setPlan(plan);
            usageItem.setType(InvoiceLineItemType.USAGE);
            usageItem.setAmount(usageCost);
            usageItem.setDescription(totalUsage.toPlainString() + " units × $" + plan.getPrice().toPlainString() + "/unit");
            invoiceLineItemRepository.save(usageItem);
            totalAmount = totalAmount.add(usageCost);
        }

        // Update invoice total
        invoice.setAmount(totalAmount);
        invoiceRepository.save(invoice);

        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            // No charge needed — mark paid and extend period
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
            extendSubscriptionPeriod(subscription);
            return;
        }

        // Attempt payment
        String cycleIdempotencyKey = "cycle_" + subscription.getId() + "_" + periodEnd.toInstant().toEpochMilli();
        PaymentTransaction tx = paymentService.processPayment(subscription, invoice, "pm_default", cycleIdempotencyKey);

        if (tx.getStatus() == PaymentStatus.SUCCESS) {
            extendSubscriptionPeriod(subscription);
            log.info("Cycle billing succeeded for subscription: {}", subscription.getId());
        } else {
            subscription.setStatus(SubscriptionStatus.PAST_DUE);
            subscriptionRepository.save(subscription);

            writeOutboxEvent("subscription.changed", Map.of(
                    "subscriptionId", subscription.getId(),
                    "planId", subscription.getPlan().getId(),
                    "status", SubscriptionStatus.PAST_DUE.name(),
                    "reason", "Cycle billing payment failed"
            ));
            log.warn("Cycle billing failed for subscription: {}. Status set to PAST_DUE.", subscription.getId());
        }
    }

    private void extendSubscriptionPeriod(Subscription subscription) {
        OffsetDateTime oldEnd = subscription.getCurrentPeriodEnd();
        OffsetDateTime newStart = oldEnd;
        OffsetDateTime newEnd;

        switch (subscription.getPlan().getBillingPeriod()) {
            case MONTHLY -> newEnd = oldEnd.plusMonths(1);
            case YEARLY -> newEnd = oldEnd.plusYears(1);
            default -> newEnd = oldEnd.plusMonths(1);
        }

        subscription.setCurrentPeriodStart(newStart);
        subscription.setCurrentPeriodEnd(newEnd);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(subscription);
        log.info("Extended subscription {} period: {} to {}", subscription.getId(), newStart, newEnd);
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
