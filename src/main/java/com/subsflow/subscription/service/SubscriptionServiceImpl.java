package com.subsflow.subscription.service;

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
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.entity.SubscriptionStatus;
import com.subsflow.subscription.repository.BillingPlanRepository;
import com.subsflow.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionServiceImpl.class);

    private final SubscriptionRepository subscriptionRepository;
    private final BillingPlanRepository billingPlanRepository;
    private final UsageEventRepository usageEventRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final PaymentService paymentService;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   BillingPlanRepository billingPlanRepository,
                                   UsageEventRepository usageEventRepository,
                                   InvoiceRepository invoiceRepository,
                                   InvoiceLineItemRepository invoiceLineItemRepository,
                                   PaymentService paymentService,
                                   OutboxEventRepository outboxEventRepository,
                                   ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.billingPlanRepository = billingPlanRepository;
        this.usageEventRepository = usageEventRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineItemRepository = invoiceLineItemRepository;
        this.paymentService = paymentService;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Subscription changePlan(String subscriptionId, String newPlanId, String paymentMethodId, String idempotencyKey) {
        log.info("Processing plan change for subscription: {} to plan: {}", subscriptionId, newPlanId);

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + subscriptionId));

        BillingPlan newPlan = billingPlanRepository.findById(newPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Billing plan not found: " + newPlanId));

        BillingPlan oldPlan = subscription.getPlan();
        if (oldPlan.getId().equals(newPlanId)) {
            log.info("Subscription is already on plan: {}. Bypassing change.", newPlanId);
            return subscription;
        }

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime start = subscription.getCurrentPeriodStart();
        OffsetDateTime end = subscription.getCurrentPeriodEnd();

        // Calculate ratios for proration
        long totalSeconds = Duration.between(start, end).toSeconds();
        long remainingSeconds = Math.max(0, Duration.between(now, end).toSeconds());
        if (totalSeconds <= 0) {
            totalSeconds = 1;
        }

        BigDecimal ratio = BigDecimal.valueOf(remainingSeconds)
                .divide(BigDecimal.valueOf(totalSeconds), 8, RoundingMode.HALF_UP);

        BigDecimal credit = oldPlan.getPrice().multiply(ratio).setScale(4, RoundingMode.HALF_UP);
        BigDecimal cost = newPlan.getPrice().multiply(ratio).setScale(4, RoundingMode.HALF_UP);
        BigDecimal netAmount = cost.subtract(credit);

        // Create Draft Invoice
        Invoice invoice = new Invoice();
        invoice.setId("inv_" + UUID.randomUUID().toString().substring(0, 8));
        invoice.setSubscription(subscription);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setDueDate(now.plusDays(7));
        
        // If netAmount is negative, we credit it to 0 for simplicity
        BigDecimal chargeAmount = netAmount.compareTo(BigDecimal.ZERO) > 0 ? netAmount : BigDecimal.ZERO;
        invoice.setAmount(chargeAmount);
        invoiceRepository.save(invoice);

        // Line Item 1: Old Plan Credit
        InvoiceLineItem refundItem = new InvoiceLineItem();
        refundItem.setId("ili_" + UUID.randomUUID().toString().substring(0, 8));
        refundItem.setInvoice(invoice);
        refundItem.setPlan(oldPlan);
        refundItem.setType(InvoiceLineItemType.PRORATION);
        refundItem.setAmount(credit.negate());
        refundItem.setDescription("Unused time credit on " + oldPlan.getName());
        invoiceLineItemRepository.save(refundItem);

        // Line Item 2: New Plan Charge
        InvoiceLineItem chargeItem = new InvoiceLineItem();
        chargeItem.setId("ili_" + UUID.randomUUID().toString().substring(0, 8));
        chargeItem.setInvoice(invoice);
        chargeItem.setPlan(newPlan);
        chargeItem.setType(InvoiceLineItemType.PRORATION);
        chargeItem.setAmount(cost);
        chargeItem.setDescription("Remaining time charge on " + newPlan.getName());
        invoiceLineItemRepository.save(chargeItem);

        invoice.getLineItems().add(refundItem);
        invoice.getLineItems().add(chargeItem);

        boolean paymentSuccess = true;
        if (chargeAmount.compareTo(BigDecimal.ZERO) > 0) {
            PaymentTransaction transaction = paymentService.processPayment(subscription, invoice, paymentMethodId, idempotencyKey);
            if (transaction.getStatus() != PaymentStatus.SUCCESS) {
                paymentSuccess = false;
            }
        } else {
            // Amount is 0 or negative: instantly mark invoice as PAID
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
        }

        // Apply changes to Subscription
        subscription.setPlan(newPlan);
        SubscriptionStatus targetStatus = paymentSuccess ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE;
        SubscriptionStatusTransition.requireTransition(subscription.getStatus(), targetStatus, "plan change");
        subscription.setStatus(targetStatus);
        Subscription updatedSubscription = subscriptionRepository.save(subscription);

        // Enqueue Outbox Event
        writeOutboxEvent("subscription.changed", Map.of(
                "subscriptionId", subscription.getId(),
                "oldPlanId", oldPlan.getId(),
                "newPlanId", newPlan.getId(),
                "status", subscription.getStatus().name(),
                "prorationAmount", chargeAmount
        ));

        return updatedSubscription;
    }

    @Override
    @Transactional
    public void ingestUsage(String subscriptionId, BigDecimal quantity, String eventType) {
        log.info("Ingesting usage event for subscription: {}, quantity: {}, type: {}", subscriptionId, quantity, eventType);

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + subscriptionId));

        UsageEvent event = new UsageEvent();
        event.setId("use_" + UUID.randomUUID().toString().substring(0, 8));
        event.setSubscription(subscription);
        event.setQuantity(quantity.setScale(4, RoundingMode.HALF_UP));
        event.setEventType(eventType);
        event.setTimestamp(OffsetDateTime.now());
        usageEventRepository.save(event);
    }

    @Override
    @Transactional
    public Subscription createSubscription(String planId) {
        log.info("Creating subscription for plan: {}", planId);
        BillingPlan plan = billingPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Billing plan not found: " + planId));

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime periodEnd;
        if (plan.getBillingPeriod() != null) {
            switch (plan.getBillingPeriod()) {
                case MINUTE -> periodEnd = now.plus(1, java.time.temporal.ChronoUnit.MINUTES);
                case HOURLY -> periodEnd = now.plus(1, java.time.temporal.ChronoUnit.HOURS);
                case DAILY -> periodEnd = now.plus(1, java.time.temporal.ChronoUnit.DAYS);
                case MONTHLY -> periodEnd = now.plusMonths(1);
                case YEARLY -> periodEnd = now.plusYears(1);
                default -> periodEnd = now.plusMonths(1);
            }
        } else {
            periodEnd = now.plusMonths(1);
        }

        Subscription subscription = new Subscription();
        subscription.setId("sub_" + UUID.randomUUID().toString().substring(0, 8));
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setVersion(0L);

        Subscription saved = subscriptionRepository.save(subscription);

        writeOutboxEvent("subscription.created", Map.of(
                "subscriptionId", saved.getId(),
                "planId", plan.getId(),
                "status", saved.getStatus().name()
        ));

        return saved;
    }

    @Override
    @Transactional
    public Subscription cancelSubscription(String subscriptionId) {
        log.info("Cancelling subscription: {}", subscriptionId);
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + subscriptionId));

        SubscriptionStatusTransition.requireTransition(subscription.getStatus(), SubscriptionStatus.CANCELLED, "cancellation");
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        Subscription saved = subscriptionRepository.save(subscription);

        writeOutboxEvent("subscription.cancelled", Map.of(
                "subscriptionId", saved.getId(),
                "status", saved.getStatus().name()
        ));

        return saved;
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
