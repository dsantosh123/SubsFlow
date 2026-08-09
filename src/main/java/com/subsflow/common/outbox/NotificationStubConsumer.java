package com.subsflow.common.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationStubConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationStubConsumer.class);

    @KafkaListener(topics = "payment.succeeded", groupId = "subsflow-group")
    public void consumePaymentSuccess(String message) {
        log.info("[STUB CONSUMER] Received payment.succeeded event: {}", message);
    }

    @KafkaListener(topics = "payment.failed", groupId = "subsflow-group")
    public void consumePaymentFailure(String message) {
        log.info("[STUB CONSUMER] Received payment.failed event: {}", message);
    }

    @KafkaListener(topics = "subscription.changed", groupId = "subsflow-group")
    public void consumeSubscriptionChange(String message) {
        log.info("[STUB CONSUMER] Received subscription.changed event: {}", message);
    }
}
