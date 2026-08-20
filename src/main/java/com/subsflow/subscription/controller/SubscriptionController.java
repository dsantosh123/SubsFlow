package com.subsflow.subscription.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.common.exception.IdempotencyConflictException;
import com.subsflow.common.exception.IdempotencyKeyUsedException;
import com.subsflow.payment.service.IdempotencyService;
import com.subsflow.subscription.entity.BillingPlan;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.repository.BillingPlanRepository;
import com.subsflow.subscription.repository.SubscriptionRepository;
import com.subsflow.subscription.service.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;
    private final SubscriptionRepository subscriptionRepository;
    private final BillingPlanRepository billingPlanRepository;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  IdempotencyService idempotencyService,
                                  ObjectMapper objectMapper,
                                  SubscriptionRepository subscriptionRepository,
                                  BillingPlanRepository billingPlanRepository) {
        this.subscriptionService = subscriptionService;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
        this.subscriptionRepository = subscriptionRepository;
        this.billingPlanRepository = billingPlanRepository;
    }

    @GetMapping
    public ResponseEntity<List<SubscriptionSummaryResponse>> listSubscriptions() {
        List<SubscriptionSummaryResponse> subscriptions = subscriptionRepository.findAll().stream()
                .map(SubscriptionSummaryResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(subscriptions);
    }

    @GetMapping("/plans")
    public ResponseEntity<List<BillingPlanResponse>> listPlans() {
        List<BillingPlanResponse> plans = billingPlanRepository.findAll().stream()
                .map(BillingPlanResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plans);
    }

    @PostMapping
    public ResponseEntity<?> createSubscription(@RequestBody CreateSubscriptionRequest request) {
        if (request.getPlanId() == null || request.getPlanId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "planId is required"));
        }
        try {
            Subscription subscription = subscriptionService.createSubscription(request.getPlanId());
            return ResponseEntity.ok(SubscriptionSummaryResponse.from(subscription));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable("id") String subscriptionId) {
        try {
            Subscription subscription = subscriptionService.cancelSubscription(subscriptionId);
            return ResponseEntity.ok(SubscriptionSummaryResponse.from(subscription));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-plan")
    public ResponseEntity<?> changePlan(
            @PathVariable("id") String subscriptionId,
            @RequestHeader(value = "Idempotency-Key") String idempotencyKey,
            @RequestBody ChangePlanRequest request) {

        if (request.getNewPlanId() == null || request.getPaymentMethodId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields newPlanId or paymentMethodId"));
        }

        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Idempotency-Key header is required"));
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
        } catch (ObjectOptimisticLockingFailureException e) {
            idempotencyService.failOperation(idempotencyKey, "Optimistic locking failure");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Subscription was updated concurrently, please retry"));
        } catch (IllegalStateException e) {
            idempotencyService.failOperation(idempotencyKey, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            idempotencyService.failOperation(idempotencyKey, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/usage")
    public ResponseEntity<?> ingestUsage(
            @PathVariable("id") String subscriptionId,
            @RequestBody IngestUsageRequest request) {

        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0 || request.getEventType() == null) {
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

    public static class SubscriptionSummaryResponse {
        private String id;
        private String status;
        private String planId;
        private String planName;
        private String currentPeriodStart;
        private String currentPeriodEnd;

        public static SubscriptionSummaryResponse from(Subscription subscription) {
            SubscriptionSummaryResponse dto = new SubscriptionSummaryResponse();
            dto.id = subscription.getId();
            dto.status = subscription.getStatus().name();
            BillingPlan plan = subscription.getPlan();
            if (plan != null) {
                dto.planId = plan.getId();
                dto.planName = plan.getName();
            }
            dto.currentPeriodStart = subscription.getCurrentPeriodStart() == null ? null : subscription.getCurrentPeriodStart().toString();
            dto.currentPeriodEnd = subscription.getCurrentPeriodEnd() == null ? null : subscription.getCurrentPeriodEnd().toString();
            return dto;
        }

        public String getId() { return id; }
        public String getStatus() { return status; }
        public String getPlanId() { return planId; }
        public String getPlanName() { return planName; }
        public String getCurrentPeriodStart() { return currentPeriodStart; }
        public String getCurrentPeriodEnd() { return currentPeriodEnd; }
    }

    public static class BillingPlanResponse {
        private String id;
        private String name;
        private String billingType;
        private String billingPeriod;
        private String price;

        public static BillingPlanResponse from(BillingPlan plan) {
            BillingPlanResponse dto = new BillingPlanResponse();
            dto.id = plan.getId();
            dto.name = plan.getName();
            dto.billingType = plan.getBillingType().name();
            dto.billingPeriod = plan.getBillingPeriod().name();
            dto.price = plan.getPrice().toPlainString();
            return dto;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getBillingType() { return billingType; }
        public String getBillingPeriod() { return billingPeriod; }
        public String getPrice() { return price; }
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
        private BigDecimal quantity;
        private String eventType;

        public BigDecimal getQuantity() {
            return quantity;
        }

        public void setQuantity(BigDecimal quantity) {
            this.quantity = quantity;
        }

        public String getEventType() {
            return eventType;
        }

        public void setEventType(String eventType) {
            this.eventType = eventType;
        }
    }

    public static class CreateSubscriptionRequest {
        private String planId;

        public String getPlanId() {
            return planId;
        }

        public void setPlanId(String planId) {
            this.planId = planId;
        }
    }
}
