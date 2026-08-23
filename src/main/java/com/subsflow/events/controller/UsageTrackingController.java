package com.subsflow.events.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.events.entity.CustomerUsageEvent;
import com.subsflow.events.service.UsageTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/usage")
public class UsageTrackingController {

    private final UsageTrackingService usageTrackingService;

    public UsageTrackingController(UsageTrackingService usageTrackingService) {
        this.usageTrackingService = usageTrackingService;
    }

    @PostMapping
    public ResponseEntity<?> recordUsage(HttpServletRequest request,
                                         @PathVariable("productId") String productId,
                                         @RequestBody RecordUsageRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            CustomerUsageEvent event = usageTrackingService.recordUsage(
                    tenantId, role, email != null ? email : "system", productId,
                    body.getCustomerId(), body.getSubscriptionId(), body.getFeatureKey(),
                    body.getQuantity() != null ? body.getQuantity() : BigDecimal.ONE,
                    body.getIdempotencyKey(), body.getOccurredAt(), body.getMetadataJson()
            );

            return ResponseEntity.ok(mapEventToResponse(event));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/events")
    public ResponseEntity<?> listUsageEvents(@PathVariable("productId") String productId,
                                             @RequestParam(value = "customerId", required = false) String customerId,
                                             @RequestParam(value = "subscriptionId", required = false) String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<CustomerUsageEvent> events = usageTrackingService.listUsageEvents(tenantId, productId, customerId, subscriptionId);
        return ResponseEntity.ok(events.stream().map(this::mapEventToResponse).collect(Collectors.toList()));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getAggregatedUsage(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Map<String, Object> summary = usageTrackingService.getAggregatedUsage(tenantId, productId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapEventToResponse(CustomerUsageEvent e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("tenantId", e.getTenant().getId());
        m.put("productId", e.getProduct().getId());
        m.put("customerId", e.getCustomer().getId());
        m.put("customerName", e.getCustomer().getName());
        m.put("subscriptionId", e.getSubscription().getId());
        m.put("featureKey", e.getFeatureKey());
        m.put("quantity", e.getQuantity());
        m.put("idempotencyKey", e.getIdempotencyKey());
        m.put("occurredAt", e.getOccurredAt());
        m.put("metadataJson", e.getMetadataJson());
        m.put("createdAt", e.getCreatedAt());
        return m;
    }

    public static class RecordUsageRequest {
        private String customerId;
        private String subscriptionId;
        private String featureKey;
        private BigDecimal quantity;
        private String idempotencyKey;
        private OffsetDateTime occurredAt;
        private String metadataJson;

        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        public String getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
        public String getFeatureKey() { return featureKey; }
        public void setFeatureKey(String featureKey) { this.featureKey = featureKey; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
        public OffsetDateTime getOccurredAt() { return occurredAt; }
        public void setOccurredAt(OffsetDateTime occurredAt) { this.occurredAt = occurredAt; }
        public String getMetadataJson() { return metadataJson; }
        public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    }
}
