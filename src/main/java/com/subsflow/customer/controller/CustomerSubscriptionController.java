package com.subsflow.customer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.common.context.TenantContext;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.entity.IdempotencyRecord;
import com.subsflow.customer.entity.SubscriptionHistory;
import com.subsflow.customer.service.CustomerSubscriptionService;
import com.subsflow.customer.service.IdempotencyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/subscriptions")
public class CustomerSubscriptionController {

    private final CustomerSubscriptionService subscriptionService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CustomerSubscriptionController(CustomerSubscriptionService subscriptionService,
                                          IdempotencyService idempotencyService) {
        this.subscriptionService = subscriptionService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<?> createSubscription(HttpServletRequest request,
                                                @PathVariable("productId") String productId,
                                                @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                                @RequestBody CreateSubscriptionRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        // Idempotency check
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecord> cachedOpt = idempotencyService.getExistingResponse(tenantId, idempotencyKey);
            if (cachedOpt.isPresent()) {
                IdempotencyRecord cached = cachedOpt.get();
                try {
                    Object parsed = objectMapper.readValue(cached.getResponseBody(), Object.class);
                    return ResponseEntity.status(cached.getResponseStatus()).body(parsed);
                } catch (Exception ignored) {}
            }
        }

        try {
            CustomerSubscription sub = subscriptionService.createSubscription(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    body.getCustomerId(),
                    body.getPlanId()
            );

            Map<String, Object> response = mapSubscriptionToResponse(sub);

            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                try {
                    String json = objectMapper.writeValueAsString(response);
                    idempotencyService.recordResponse(tenantId, idempotencyKey, "SUBSCRIPTION_CREATE", sub.getId(), 200, json);
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listSubscriptions(@PathVariable("productId") String productId,
                                               @RequestParam(value = "customerId", required = false) String customerId,
                                               @RequestParam(value = "status", required = false) String statusStr,
                                               @RequestParam(value = "planId", required = false) String planId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        CustomerSubscriptionStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                status = CustomerSubscriptionStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        List<CustomerSubscription> subscriptions = subscriptionService.listSubscriptions(
                tenantId, productId, customerId, status, planId
        );

        List<Map<String, Object>> response = subscriptions.stream()
                .map(this::mapSubscriptionToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{subscriptionId}")
    public ResponseEntity<?> getSubscription(@PathVariable("productId") String productId,
                                             @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerSubscription sub = subscriptionService.getSubscription(tenantId, productId, subscriptionId);
            return ResponseEntity.ok(mapSubscriptionToResponse(sub));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{subscriptionId}/pause")
    public ResponseEntity<?> pauseSubscription(HttpServletRequest request,
                                               @PathVariable("productId") String productId,
                                               @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerSubscription sub = subscriptionService.pauseSubscription(
                    tenantId, role, email != null ? email : "system", productId, subscriptionId
            );
            return ResponseEntity.ok(mapSubscriptionToResponse(sub));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{subscriptionId}/resume")
    public ResponseEntity<?> resumeSubscription(HttpServletRequest request,
                                                @PathVariable("productId") String productId,
                                                @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerSubscription sub = subscriptionService.resumeSubscription(
                    tenantId, role, email != null ? email : "system", productId, subscriptionId
            );
            return ResponseEntity.ok(mapSubscriptionToResponse(sub));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{subscriptionId}/cancel")
    public ResponseEntity<?> cancelSubscription(HttpServletRequest request,
                                                @PathVariable("productId") String productId,
                                                @PathVariable("subscriptionId") String subscriptionId,
                                                @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                                @RequestBody(required = false) CancelSubscriptionRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        boolean cancelAtPeriodEnd = (body != null && body.isCancelAtPeriodEnd());

        try {
            CustomerSubscription sub = subscriptionService.cancelSubscription(
                    tenantId, role, email != null ? email : "system", productId, subscriptionId, cancelAtPeriodEnd
            );

            Map<String, Object> response = mapSubscriptionToResponse(sub);

            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                try {
                    String json = objectMapper.writeValueAsString(response);
                    idempotencyService.recordResponse(tenantId, idempotencyKey, "SUBSCRIPTION_CANCEL", sub.getId(), 200, json);
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{subscriptionId}/change-plan")
    public ResponseEntity<?> changePlan(HttpServletRequest request,
                                        @PathVariable("productId") String productId,
                                        @PathVariable("subscriptionId") String subscriptionId,
                                        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                        @RequestBody ChangePlanRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerSubscription sub = subscriptionService.changePlan(
                    tenantId, role, email != null ? email : "system", productId, subscriptionId, body.getNewPlanId()
            );

            Map<String, Object> response = mapSubscriptionToResponse(sub);

            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                try {
                    String json = objectMapper.writeValueAsString(response);
                    idempotencyService.recordResponse(tenantId, idempotencyKey, "PLAN_CHANGE", sub.getId(), 200, json);
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{subscriptionId}/history")
    public ResponseEntity<?> getHistory(@PathVariable("productId") String productId,
                                        @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            List<SubscriptionHistory> history = subscriptionService.listHistory(tenantId, productId, subscriptionId);
            List<Map<String, Object>> response = history.stream()
                    .map(h -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", h.getId());
                        m.put("action", h.getAction().name());
                        m.put("previousStatus", h.getPreviousStatus());
                        m.put("newStatus", h.getNewStatus());
                        m.put("previousPlanId", h.getPreviousPlanId());
                        m.put("newPlanId", h.getNewPlanId());
                        m.put("performedBy", h.getPerformedBy());
                        m.put("details", h.getDetails());
                        m.put("createdAt", h.getCreatedAt());
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapSubscriptionToResponse(CustomerSubscription sub) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", sub.getId());
        map.put("tenantId", sub.getTenant().getId());
        map.put("productId", sub.getProduct().getId());
        map.put("customerId", sub.getCustomer().getId());
        map.put("customerName", sub.getCustomer().getName());
        map.put("customerEmail", sub.getCustomer().getEmail());
        map.put("planId", sub.getPlan().getId());
        map.put("planName", sub.getPlan().getName());
        map.put("planVersion", sub.getPlanVersion());
        map.put("status", sub.getStatus().name());
        map.put("priceAtSubscription", sub.getPriceAtSubscription());
        map.put("currencyAtSubscription", sub.getCurrencyAtSubscription());
        map.put("billingIntervalAtSubscription", sub.getBillingIntervalAtSubscription());
        map.put("trialDays", sub.getTrialDays());
        map.put("featuresSnapshotJson", sub.getFeaturesSnapshotJson());
        map.put("startDate", sub.getStartDate());
        map.put("trialEndDate", sub.getTrialEndDate());
        map.put("currentPeriodStart", sub.getCurrentPeriodStart());
        map.put("currentPeriodEnd", sub.getCurrentPeriodEnd());
        map.put("cancelAtPeriodEnd", sub.isCancelAtPeriodEnd());
        map.put("cancelledAt", sub.getCancelledAt());
        map.put("endedAt", sub.getEndedAt());
        map.put("createdAt", sub.getCreatedAt());
        map.put("updatedAt", sub.getUpdatedAt());
        return map;
    }

    public static class CreateSubscriptionRequest {
        private String customerId;
        private String planId;

        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        public String getPlanId() { return planId; }
        public void setPlanId(String planId) { this.planId = planId; }
    }

    public static class CancelSubscriptionRequest {
        private boolean cancelAtPeriodEnd;

        public boolean isCancelAtPeriodEnd() { return cancelAtPeriodEnd; }
        public void setCancelAtPeriodEnd(boolean cancelAtPeriodEnd) { this.cancelAtPeriodEnd = cancelAtPeriodEnd; }
    }

    public static class ChangePlanRequest {
        private String newPlanId;

        public String getNewPlanId() { return newPlanId; }
        public void setNewPlanId(String newPlanId) { this.newPlanId = newPlanId; }
    }
}
