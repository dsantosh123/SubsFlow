package com.subsflow.plan.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.plan.entity.*;
import com.subsflow.plan.service.ProductPlanService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/plans")
public class ProductPlanController {

    private final ProductPlanService planService;

    public ProductPlanController(ProductPlanService planService) {
        this.planService = planService;
    }

    @PostMapping
    public ResponseEntity<?> createPlan(HttpServletRequest request,
                                        @PathVariable("productId") String productId,
                                        @RequestBody CreatePlanRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            BillingInterval interval = body.getBillingInterval() != null
                    ? BillingInterval.valueOf(body.getBillingInterval().toUpperCase())
                    : BillingInterval.MONTHLY;

            PlanVisibility visibility = body.getVisibility() != null
                    ? PlanVisibility.valueOf(body.getVisibility().toUpperCase())
                    : PlanVisibility.PUBLIC;

            ProductPlan plan = planService.createPlan(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    body.getName(),
                    body.getDescription(),
                    body.getPrice() != null ? body.getPrice() : BigDecimal.ZERO,
                    body.getCurrency(),
                    interval,
                    body.getTrialDays(),
                    visibility
            );

            return ResponseEntity.ok(mapPlanToResponse(plan));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listPlans(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            List<ProductPlan> plans = planService.listPlansForProduct(tenantId, productId);
            List<Map<String, Object>> response = plans.stream()
                    .map(this::mapPlanToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{planId}")
    public ResponseEntity<?> getPlan(@PathVariable("productId") String productId,
                                     @PathVariable("planId") String planId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            ProductPlan plan = planService.getPlan(tenantId, productId, planId);
            return ResponseEntity.ok(mapPlanToResponse(plan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{planId}")
    public ResponseEntity<?> updatePlan(HttpServletRequest request,
                                        @PathVariable("productId") String productId,
                                        @PathVariable("planId") String planId,
                                        @RequestBody UpdatePlanRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            BillingInterval interval = body.getBillingInterval() != null
                    ? BillingInterval.valueOf(body.getBillingInterval().toUpperCase())
                    : null;

            PlanVisibility visibility = body.getVisibility() != null
                    ? PlanVisibility.valueOf(body.getVisibility().toUpperCase())
                    : null;

            ProductPlan plan = planService.updatePlan(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    planId,
                    body.getName(),
                    body.getDescription(),
                    body.getPrice(),
                    body.getCurrency(),
                    interval,
                    body.getTrialDays(),
                    visibility
            );

            return ResponseEntity.ok(mapPlanToResponse(plan));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{planId}/status")
    public ResponseEntity<?> setPlanStatus(HttpServletRequest request,
                                           @PathVariable("productId") String productId,
                                           @PathVariable("planId") String planId,
                                           @RequestBody StatusUpdateRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            PlanStatus status = PlanStatus.valueOf(body.getStatus().toUpperCase());
            ProductPlan plan = planService.setPlanStatus(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    planId,
                    status
            );

            return ResponseEntity.ok(mapPlanToResponse(plan));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reorder")
    public ResponseEntity<?> reorderPlans(HttpServletRequest request,
                                          @PathVariable("productId") String productId,
                                          @RequestBody ReorderRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            List<ProductPlan> plans = planService.reorderPlans(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    body.getPlanIds()
            );

            return ResponseEntity.ok(plans.stream().map(this::mapPlanToResponse).collect(Collectors.toList()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // Feature Management (Separate APIs)
    // ==========================================

    @PostMapping("/{planId}/features")
    public ResponseEntity<?> addFeature(HttpServletRequest request,
                                        @PathVariable("productId") String productId,
                                        @PathVariable("planId") String planId,
                                        @RequestBody CreateFeatureRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            FeatureValueType valueType = body.getValueType() != null
                    ? FeatureValueType.valueOf(body.getValueType().toUpperCase())
                    : FeatureValueType.TEXT;

            PlanFeature feature = planService.addFeature(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    planId,
                    body.getFeatureKey(),
                    body.getFeatureName(),
                    body.getValue(),
                    valueType
            );

            return ResponseEntity.ok(mapFeatureToResponse(feature));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{planId}/features/{featureId}")
    public ResponseEntity<?> updateFeature(HttpServletRequest request,
                                           @PathVariable("productId") String productId,
                                           @PathVariable("planId") String planId,
                                           @PathVariable("featureId") String featureId,
                                           @RequestBody UpdateFeatureRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            FeatureValueType valueType = body.getValueType() != null
                    ? FeatureValueType.valueOf(body.getValueType().toUpperCase())
                    : null;

            PlanFeature feature = planService.updateFeature(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    planId,
                    featureId,
                    body.getFeatureKey(),
                    body.getFeatureName(),
                    body.getValue(),
                    valueType
            );

            return ResponseEntity.ok(mapFeatureToResponse(feature));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{planId}/features/{featureId}")
    public ResponseEntity<?> deleteFeature(HttpServletRequest request,
                                           @PathVariable("productId") String productId,
                                           @PathVariable("planId") String planId,
                                           @PathVariable("featureId") String featureId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            planService.deleteFeature(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    planId,
                    featureId
            );

            return ResponseEntity.ok(Map.of("message", "Feature removed successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{planId}/audit-logs")
    public ResponseEntity<?> getPlanAuditLogs(@PathVariable("productId") String productId,
                                              @PathVariable("planId") String planId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            List<PlanAuditLog> logs = planService.listPlanAuditLogs(tenantId, productId, planId);
            List<Map<String, Object>> response = logs.stream()
                    .map(l -> Map.<String, Object>of(
                            "id", l.getId(),
                            "action", l.getAction().name(),
                            "performedBy", l.getPerformedBy() != null ? l.getPerformedBy() : "system",
                            "details", l.getDetails() != null ? l.getDetails() : "",
                            "createdAt", l.getCreatedAt()
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapPlanToResponse(ProductPlan plan) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", plan.getId());
        map.put("tenantId", plan.getTenant().getId());
        map.put("productId", plan.getProduct().getId());
        map.put("name", plan.getName());
        map.put("description", plan.getDescription() != null ? plan.getDescription() : "");
        map.put("status", plan.getStatus().name());
        map.put("visibility", plan.getVisibility().name());
        map.put("price", plan.getPrice());
        map.put("currency", plan.getCurrency());
        map.put("billingInterval", plan.getBillingInterval().name());
        map.put("trialDays", plan.getTrialDays());
        map.put("displayOrder", plan.getDisplayOrder());
        map.put("version", plan.getVersion());
        map.put("features", plan.getFeatures().stream().map(this::mapFeatureToResponse).collect(Collectors.toList()));
        map.put("createdAt", plan.getCreatedAt());
        map.put("updatedAt", plan.getUpdatedAt());
        return map;
    }

    private Map<String, Object> mapFeatureToResponse(PlanFeature feature) {
        return Map.of(
                "id", feature.getId(),
                "featureKey", feature.getFeatureKey(),
                "featureName", feature.getFeatureName(),
                "value", feature.getValue(),
                "valueType", feature.getValueType().name(),
                "displayOrder", feature.getDisplayOrder(),
                "createdAt", feature.getCreatedAt()
        );
    }

    public static class CreatePlanRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private String billingInterval;
        private int trialDays;
        private String visibility;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getBillingInterval() { return billingInterval; }
        public void setBillingInterval(String billingInterval) { this.billingInterval = billingInterval; }
        public int getTrialDays() { return trialDays; }
        public void setTrialDays(int trialDays) { this.trialDays = trialDays; }
        public String getVisibility() { return visibility; }
        public void setVisibility(String visibility) { this.visibility = visibility; }
    }

    public static class UpdatePlanRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private String billingInterval;
        private int trialDays;
        private String visibility;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getBillingInterval() { return billingInterval; }
        public void setBillingInterval(String billingInterval) { this.billingInterval = billingInterval; }
        public int getTrialDays() { return trialDays; }
        public void setTrialDays(int trialDays) { this.trialDays = trialDays; }
        public String getVisibility() { return visibility; }
        public void setVisibility(String visibility) { this.visibility = visibility; }
    }

    public static class StatusUpdateRequest {
        private String status;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ReorderRequest {
        private List<String> planIds;

        public List<String> getPlanIds() { return planIds; }
        public void setPlanIds(List<String> planIds) { this.planIds = planIds; }
    }

    public static class CreateFeatureRequest {
        private String featureKey;
        private String featureName;
        private String value;
        private String valueType;

        public String getFeatureKey() { return featureKey; }
        public void setFeatureKey(String featureKey) { this.featureKey = featureKey; }
        public String getFeatureName() { return featureName; }
        public void setFeatureName(String featureName) { this.featureName = featureName; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        public String getValueType() { return valueType; }
        public void setValueType(String valueType) { this.valueType = valueType; }
    }

    public static class UpdateFeatureRequest {
        private String featureKey;
        private String featureName;
        private String value;
        private String valueType;

        public String getFeatureKey() { return featureKey; }
        public void setFeatureKey(String featureKey) { this.featureKey = featureKey; }
        public String getFeatureName() { return featureName; }
        public void setFeatureName(String featureName) { this.featureName = featureName; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        public String getValueType() { return valueType; }
        public void setValueType(String valueType) { this.valueType = valueType; }
    }
}
