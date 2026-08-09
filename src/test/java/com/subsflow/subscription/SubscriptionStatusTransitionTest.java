package com.subsflow.subscription;

import com.subsflow.subscription.entity.SubscriptionStatus;
import com.subsflow.subscription.service.SubscriptionStatusTransition;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SubscriptionStatusTransitionTest {

    @Test
    void cancelToActiveTransitionIsRejected() {
        assertThatThrownBy(() -> SubscriptionStatusTransition.requireTransition(
                SubscriptionStatus.CANCELLED,
                SubscriptionStatus.ACTIVE,
                "reactivation"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not allowed");
    }

    @Test
    void pastDueToActiveTransitionIsAllowed() {
        assertThatCode(() -> SubscriptionStatusTransition.requireTransition(
                SubscriptionStatus.PAST_DUE,
                SubscriptionStatus.ACTIVE,
                "payment recovered"
        )).doesNotThrowAnyException();
    }
}
