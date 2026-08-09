package com.subsflow.subscription.service;

import com.subsflow.subscription.entity.Subscription;

public interface SubscriptionService {
    /**
     * Changes a subscription's plan mid-cycle, calculating proration, generating invoices,
     * executing charges via the payment service, and updating status under optimistic locks.
     */
    Subscription changePlan(String subscriptionId, String newPlanId, String paymentMethodId, String idempotencyKey);
    
    /**
     * Records a usage event for the current cycle.
     */
    void ingestUsage(String subscriptionId, double quantity, String eventType);
}
