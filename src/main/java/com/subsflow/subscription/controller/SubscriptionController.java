package com.subsflow.subscription.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.common.exception.IdempotencyConflictException;
import com.subsflow.common.exception.IdempotencyKeyUsedException;
import com.subsflow.payment.service.IdempotencyService;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.service.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  IdempotencyService idempotencyService,
                                  ObjectMapper objectMapper) {
        this.subscriptionService = subscriptionService;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{id}/change-plan")
    public ResponseEntity<?> changePlan(
            @PathVariable("id") String subscriptionId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody ChangePlanRequest request) {

        if (request.getNewPlanId() == null || request.getPaymentMethodId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields newPlanId or paymentMethodId"));
        }

        // If Idempotency-Key is not provided, process normally without caching
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            try {
                Subscription sub = subscriptionService.changePlan(subscriptionId, request.getNewPlanId(), request.getPaymentMethodId(), null);
                return ResponseEntity.ok(sub);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
            }
        }

        // Calculate SHA-256 Hash of the input parameters to detect key reuse misuse
        String requestHash = calculateHash(request.getNewPlanId(), request.getPaymentMethodId());

        try {
            idempotencyService.startOperation(idempotencyKey, requestHash);
        } catch (IdempotencyConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IdempotencyKeyUsedException e) {
            // Already completed request - return cached response
            try {
                Object cachedResponse = objectMapper.readValue(e.getResponsePayload(), Object.class);
                return ResponseEntity.ok()
                        .header("X-Cache-Lookup", "HIT")
                        .body(cachedResponse);
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to deserialize cached response"));
            }
        }

        // Execute the change plan business operation
        try {
            Subscription updatedSub = subscriptionService.changePlan(subscriptionId, request.getNewPlanId(), request.getPaymentMethodId(), idempotencyKey);
            String jsonResponse = objectMapper.writeValueAsString(updatedSub);
            idempotencyService.completeOperation(idempotencyKey, jsonResponse);
            return ResponseEntity.ok(updatedSub);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/usage")
    public ResponseEntity<?> ingestUsage(
            @PathVariable("id") String subscriptionId,
            @RequestBody IngestUsageRequest request) {

        if (request.getQuantity() <= 0 || request.getEventType() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid quantity or eventType"));
        }

        try {
            subscriptionService.ingestUsage(subscriptionId, request.getQuantity(), request.getEventType());
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    private String calculateHash(String newPlanId, String paymentMethodId) {
        try {
            String raw = newPlanId + "|" + paymentMethodId;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }

    public static class ChangePlanRequest {
        private String newPlanId;
        private String paymentMethodId;

        public String getNewPlanId() {
            return newPlanId;
        }

        public void setNewPlanId(String newPlanId) {
            this.newPlanId = newPlanId;
        }

        public String getPaymentMethodId() {
            return paymentMethodId;
        }

        public void setPaymentMethodId(String paymentMethodId) {
            this.paymentMethodId = paymentMethodId;
        }
    }

    public static class IngestUsageRequest {
        private double quantity;
        private String eventType;

        public double getQuantity() {
            return quantity;
        }

        public void setQuantity(double quantity) {
            this.quantity = quantity;
        }

        public String getEventType() {
            return eventType;
        }

        public void setEventType(String eventType) {
            this.eventType = eventType;
        }
    }
}
