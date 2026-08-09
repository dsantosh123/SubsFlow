package com.subsflow.billing.service;

public interface BillingCycleService {
    /**
     * Bills all active subscriptions whose current billing period has ended.
     * For each due subscription:
     * 1. Aggregates usage events for usage-based plans.
     * 2. Generates the cycle invoice with flat fee + usage line items.
     * 3. Attempts immediate payment.
     * 4. If successful, extends the subscription into the next billing period.
     * 5. If failed, marks the subscription as PAST_DUE (dunning takes over).
     */
    void billDueSubscriptions(String tenantId);
}
