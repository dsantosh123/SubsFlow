package com.subsflow.subscription.service;

import com.subsflow.subscription.entity.Subscription;

import java.math.BigDecimal;

public interface SubscriptionService {
    /**
     * Changes a subscription's plan mid-cycle, calculating proration, generating invoices,
     * executing charges via the payment service, and updating status under optimistic locks.
     */
    Subscription changePlan(String subscriptionId, String newPlanId, String paymentMethodId, String idempotencyKey);

    /**
     * Creates a new subscription for a given plan.
     */
    Subscription createSubscription(String planId);

    /**
     * Cancels an existing active or past-due subscription.
     */
    Subscription cancelSubscription(String subscriptionId);

    /**
     * Records a usage event for the current cycle.
     */
    void ingestUsage(String subscriptionId, BigDecimal quantity, String eventType);
}
