package com.subsflow.subscription.service;

import com.subsflow.subscription.entity.SubscriptionStatus;

public final class SubscriptionStatusTransition {

    private SubscriptionStatusTransition() {
    }

    public static void requireTransition(SubscriptionStatus current, SubscriptionStatus target, String operation) {
        if (current == SubscriptionStatus.CANCELLED && target == SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Subscription reactivation is not allowed after cancellation for " + operation);
        }
        if (current == SubscriptionStatus.SUSPENDED && target == SubscriptionStatus.ACTIVE) {
            return;
        }
        if (current == SubscriptionStatus.PAST_DUE && target == SubscriptionStatus.ACTIVE) {
            return;
        }
        if (current == SubscriptionStatus.ACTIVE && target == SubscriptionStatus.PAST_DUE) {
            return;
        }
        if (current == SubscriptionStatus.ACTIVE && target == SubscriptionStatus.SUSPENDED) {
            return;
        }
        if (current == SubscriptionStatus.PAST_DUE && target == SubscriptionStatus.SUSPENDED) {
            return;
        }
        if (current == SubscriptionStatus.ACTIVE && target == SubscriptionStatus.CANCELLED) {
            return;
        }
        if (current == SubscriptionStatus.PAST_DUE && target == SubscriptionStatus.CANCELLED) {
            return;
        }
    }
}
