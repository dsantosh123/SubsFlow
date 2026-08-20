package com.subsflow.common.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

@Component
public class NotificationStubConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationStubConsumer.class);
    private final StringRedisTemplate redisTemplate;

    public NotificationStubConsumer(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @KafkaListener(topics = "payment.succeeded", groupId = "subsflow-group")
    public void consumePaymentSuccess(String message) {
        if (isDuplicate(message, "payment.succeeded")) {
            log.info("Duplicate payment.succeeded event ignored: {}", message);
            return;
        }
        log.info("[NOTIFICATION CONSUMER] Processed payment.succeeded event: {}", message);
    }

    @KafkaListener(topics = "payment.failed", groupId = "subsflow-group")
    public void consumePaymentFailure(String message) {
        if (isDuplicate(message, "payment.failed")) {
            log.info("Duplicate payment.failed event ignored: {}", message);
            return;
        }
        log.info("[NOTIFICATION CONSUMER] Processed payment.failed event: {}", message);
    }

    @KafkaListener(topics = "subscription.changed", groupId = "subsflow-group")
    public void consumeSubscriptionChange(String message) {
        if (isDuplicate(message, "subscription.changed")) {
            log.info("Duplicate subscription.changed event ignored: {}", message);
            return;
        }
        log.info("[NOTIFICATION CONSUMER] Processed subscription.changed event: {}", message);
    }

    private boolean isDuplicate(String message, String topic) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(message.getBytes(StandardCharsets.UTF_8));
            String key = "kafka:dedup:" + topic + ":" + HexFormat.of().formatHex(hash);

            // Set with 24 hour TTL atomically. Returns true if key was NOT present.
            Boolean wasSet = redisTemplate.opsForValue().setIfAbsent(key, "1", Duration.ofHours(24));
            return wasSet != null && !wasSet;
        } catch (Exception e) {
            log.warn("Redis deduplication check failed. Proceeding with message consumption: {}", e.getMessage());
            return false;
        }
    }
}
