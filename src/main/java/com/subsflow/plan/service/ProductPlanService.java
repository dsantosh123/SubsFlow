package com.subsflow.plan.service;

import com.subsflow.plan.entity.*;
import com.subsflow.plan.repository.PlanAuditLogRepository;
import com.subsflow.plan.repository.PlanFeatureRepository;
import com.subsflow.plan.repository.ProductPlanRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductPlanService {

    private final ProductPlanRepository planRepository;
    private final PlanFeatureRepository featureRepository;
    private final PlanAuditLogRepository auditLogRepository;
    private final ProductRepository productRepository;

    public ProductPlanService(ProductPlanRepository planRepository,
                              PlanFeatureRepository featureRepository,
                              PlanAuditLogRepository auditLogRepository,
                              ProductRepository productRepository) {
        this.planRepository = planRepository;
        this.featureRepository = featureRepository;
        this.auditLogRepository = auditLogRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public ProductPlan createPlan(String tenantId, String userRole, String actorEmail, String productId,
                                  String name, String description, BigDecimal price, String currency,
                                  BillingInterval billingInterval, int trialDays, PlanVisibility visibility) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Plan name is required");
        }

        String cleanName = name.trim();
        if (planRepository.existsByProductIdAndNameIgnoreCase(productId, cleanName)) {
            throw new IllegalArgumentException("A plan with name '" + cleanName + "' already exists for this product");
        }

        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }

        if (currency == null || currency.trim().isEmpty()) {
            currency = "USD";
        }
        String cleanCurrency = currency.trim().toUpperCase();

        if (billingInterval == null) {
            billingInterval = BillingInterval.MONTHLY;
        }

        if (trialDays < 0) {
            throw new IllegalArgumentException("Trial days cannot be negative");
        }

        if (visibility == null) {
            visibility = PlanVisibility.PUBLIC;
        }

        int nextOrder = planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(productId).size();

        ProductPlan plan = new ProductPlan();
        plan.setId("plan_" + UUID.randomUUID().toString().substring(0, 8));
        plan.setTenant(product.getTenant());
        plan.setProduct(product);
        plan.setName(cleanName);
        plan.setDescription(description != null ? description.trim() : null);
        plan.setStatus(PlanStatus.DRAFT);
        plan.setVisibility(visibility);
        plan.setPrice(price);
        plan.setCurrency(cleanCurrency);
        plan.setBillingInterval(billingInterval);
        plan.setTrialDays(trialDays);
        plan.setDisplayOrder(nextOrder);
        plan.setVersion(1L);

        plan = planRepository.save(plan);

        // Audit log
        logAudit(product, plan, PlanAuditAction.PLAN_CREATED, actorEmail, "Created plan '" + plan.getName() + "' in DRAFT status");

        return plan;
    }

    @Transactional(readOnly = true)
    public List<ProductPlan> listPlansForProduct(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        return planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(productId);
    }

    @Transactional(readOnly = true)
    public ProductPlan getPlan(String tenantId, String productId, String planId) {
        return validatePlanBelongsToProduct(tenantId, productId, planId);
    }

    @Transactional
    public ProductPlan updatePlan(String tenantId, String userRole, String actorEmail, String productId,
                                  String planId, String name, String description, BigDecimal price,
                                  String currency, BillingInterval billingInterval, int trialDays,
                                  PlanVisibility visibility) {
        validateWritePermission(userRole);
        ProductPlan plan = validatePlanBelongsToProduct(tenantId, productId, planId);

        if (plan.getStatus() == PlanStatus.ARCHIVED) {
            throw new IllegalStateException("Archived plans cannot be edited");
        }

        if (name != null && !name.trim().isEmpty()) {
            String cleanName = name.trim();
            if (planRepository.existsByProductIdAndNameIgnoreCaseAndIdNot(productId, cleanName, planId)) {
                throw new IllegalArgumentException("A plan with name '" + cleanName + "' already exists for this product");
            }
            plan.setName(cleanName);
        }

        if (description != null) {
            plan.setDescription(description.trim());
        }

        if (price != null) {
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Price cannot be negative");
            }
            plan.setPrice(price);
        }

        if (currency != null && !currency.trim().isEmpty()) {
            plan.setCurrency(currency.trim().toUpperCase());
        }

        if (billingInterval != null) {
            plan.setBillingInterval(billingInterval);
        }

        if (trialDays >= 0) {
            plan.setTrialDays(trialDays);
        }

        if (visibility != null) {
            plan.setVisibility(visibility);
        }

        plan = planRepository.save(plan);
        logAudit(plan.getProduct(), plan, PlanAuditAction.PLAN_UPDATED, actorEmail, "Updated plan '" + plan.getName() + "'");

        return plan;
    }

    @Transactional
    public ProductPlan setPlanStatus(String tenantId, String userRole, String actorEmail,
                                     String productId, String planId, PlanStatus targetStatus) {
        validateWritePermission(userRole);
        ProductPlan plan = validatePlanBelongsToProduct(tenantId, productId, planId);
        PlanStatus currentStatus = plan.getStatus();

        if (currentStatus == PlanStatus.ARCHIVED) {
            throw new IllegalStateException("Archived plans cannot be modified or reactivated");
        }

        if (currentStatus == targetStatus) {
            return plan;
        }

        // Validate state machine transitions
        boolean validTransition = false;
        PlanAuditAction action = null;

        switch (currentStatus) {
            case DRAFT:
                if (targetStatus == PlanStatus.ACTIVE) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_ACTIVATED;
                } else if (targetStatus == PlanStatus.ARCHIVED) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_ARCHIVED;
                }
                break;
            case ACTIVE:
                if (targetStatus == PlanStatus.INACTIVE) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_DEACTIVATED;
                } else if (targetStatus == PlanStatus.ARCHIVED) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_ARCHIVED;
                }
                break;
            case INACTIVE:
                if (targetStatus == PlanStatus.ACTIVE) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_ACTIVATED;
                } else if (targetStatus == PlanStatus.ARCHIVED) {
                    validTransition = true;
                    action = PlanAuditAction.PLAN_ARCHIVED;
                }
                break;
            case ARCHIVED:
                validTransition = false;
                break;
        }

        if (!validTransition) {
            throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + targetStatus);
        }

        plan.setStatus(targetStatus);
        plan = planRepository.save(plan);

        logAudit(plan.getProduct(), plan, action, actorEmail, "Plan status transitioned from " + currentStatus + " to " + targetStatus);

        return plan;
    }

    @Transactional
    public List<ProductPlan> reorderPlans(String tenantId, String userRole, String actorEmail,
                                          String productId, List<String> planIdsInOrder) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        List<ProductPlan> plans = planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(productId);
        Map<String, ProductPlan> planMap = plans.stream().collect(Collectors.toMap(ProductPlan::getId, p -> p));

        for (int i = 0; i < planIdsInOrder.size(); i++) {
            String id = planIdsInOrder.get(i);
            ProductPlan plan = planMap.get(id);
            if (plan != null) {
                plan.setDisplayOrder(i);
                planRepository.save(plan);
            }
        }

        logAudit(product, null, PlanAuditAction.PLAN_REORDERED, actorEmail, "Reordered " + planIdsInOrder.size() + " plans");

        return planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(productId);
    }

    // ==========================================
    // Feature Management (Separate APIs)
    // ==========================================

    @Transactional
    public PlanFeature addFeature(String tenantId, String userRole, String actorEmail,
                                  String productId, String planId, String featureKey,
                                  String featureName, String value, FeatureValueType valueType) {
        validateWritePermission(userRole);
        ProductPlan plan = validatePlanBelongsToProduct(tenantId, productId, planId);

        if (plan.getStatus() == PlanStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot add features to an archived plan");
        }

        if (featureKey == null || featureKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Feature key is required");
        }
        if (featureName == null || featureName.trim().isEmpty()) {
            throw new IllegalArgumentException("Feature name is required");
        }
        if (value == null) {
            value = "";
        }

        String cleanKey = featureKey.trim().toLowerCase().replace(" ", "_");
        if (featureRepository.existsByPlanIdAndFeatureKeyIgnoreCase(planId, cleanKey)) {
            throw new IllegalArgumentException("Feature with key '" + cleanKey + "' already exists for this plan");
        }

        int nextOrder = featureRepository.findAllByPlanIdOrderByDisplayOrderAsc(planId).size();

        PlanFeature feature = new PlanFeature();
        feature.setId("pfeat_" + UUID.randomUUID().toString().substring(0, 8));
        feature.setPlan(plan);
        feature.setFeatureKey(cleanKey);
        feature.setFeatureName(featureName.trim());
        feature.setValue(value.trim());
        feature.setValueType(valueType != null ? valueType : FeatureValueType.TEXT);
        feature.setDisplayOrder(nextOrder);

        feature = featureRepository.save(feature);
        logAudit(plan.getProduct(), plan, PlanAuditAction.PLAN_FEATURE_ADDED, actorEmail, "Added feature '" + feature.getFeatureName() + "' (" + cleanKey + ")");

        return feature;
    }

    @Transactional
    public PlanFeature updateFeature(String tenantId, String userRole, String actorEmail,
                                     String productId, String planId, String featureId,
                                     String featureKey, String featureName, String value, FeatureValueType valueType) {
        validateWritePermission(userRole);
        ProductPlan plan = validatePlanBelongsToProduct(tenantId, productId, planId);

        if (plan.getStatus() == PlanStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot edit features of an archived plan");
        }

        PlanFeature feature = featureRepository.findByIdAndPlanId(featureId, planId)
                .orElseThrow(() -> new IllegalArgumentException("Feature not found"));

        if (featureKey != null && !featureKey.trim().isEmpty()) {
            String cleanKey = featureKey.trim().toLowerCase().replace(" ", "_");
            if (featureRepository.existsByPlanIdAndFeatureKeyIgnoreCaseAndIdNot(planId, cleanKey, featureId)) {
                throw new IllegalArgumentException("Feature with key '" + cleanKey + "' already exists for this plan");
            }
            feature.setFeatureKey(cleanKey);
        }

        if (featureName != null && !featureName.trim().isEmpty()) {
            feature.setFeatureName(featureName.trim());
        }

        if (value != null) {
            feature.setValue(value.trim());
        }

        if (valueType != null) {
            feature.setValueType(valueType);
        }

        feature = featureRepository.save(feature);
        logAudit(plan.getProduct(), plan, PlanAuditAction.PLAN_FEATURE_UPDATED, actorEmail, "Updated feature '" + feature.getFeatureName() + "'");

        return feature;
    }

    @Transactional
    public void deleteFeature(String tenantId, String userRole, String actorEmail,
                              String productId, String planId, String featureId) {
        validateWritePermission(userRole);
        ProductPlan plan = validatePlanBelongsToProduct(tenantId, productId, planId);

        if (plan.getStatus() == PlanStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot delete features from an archived plan");
        }

        PlanFeature feature = featureRepository.findByIdAndPlanId(featureId, planId)
                .orElseThrow(() -> new IllegalArgumentException("Feature not found"));

        featureRepository.delete(feature);
        logAudit(plan.getProduct(), plan, PlanAuditAction.PLAN_FEATURE_REMOVED, actorEmail, "Removed feature '" + feature.getFeatureName() + "'");
    }

    @Transactional(readOnly = true)
    public List<PlanAuditLog> listPlanAuditLogs(String tenantId, String productId, String planId) {
        validatePlanBelongsToProduct(tenantId, productId, planId);
        return auditLogRepository.findAllByPlanIdOrderByCreatedAtDesc(planId);
    }

    // ==========================================
    // Public Catalog API (Requirement #3 & #4)
    // ==========================================

    @Transactional(readOnly = true)
    public List<PublicPlanResponse> getPublicPlansForProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Requirement #4: Product must be ACTIVE
        if (product.getStatus() != ProductStatus.ACTIVE) {
            return Collections.emptyList();
        }

        // Requirement #4: Plan must be ACTIVE and PUBLIC
        List<ProductPlan> plans = planRepository.findAllByProductIdAndStatusAndVisibilityOrderByDisplayOrderAsc(
                productId,
                PlanStatus.ACTIVE,
                PlanVisibility.PUBLIC
        );

        // Requirement #3: Safe customer-facing mapping only
        return plans.stream()
                .map(p -> new PublicPlanResponse(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getPrice(),
                        p.getCurrency(),
                        p.getBillingInterval().name(),
                        p.getTrialDays(),
                        p.getFeatures().stream()
                                .map(f -> new PublicFeatureResponse(
                                        f.getFeatureKey(),
                                        f.getFeatureName(),
                                        f.getValue(),
                                        f.getValueType().name()
                                ))
                                .collect(Collectors.toList())
                ))
                .collect(Collectors.toList());
    }

    // ==========================================
    // Internal Validation & Helpers
    // ==========================================

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) {
            throw new IllegalStateException("User role context is required");
        }
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can perform this action");
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }

    private ProductPlan validatePlanBelongsToProduct(String tenantId, String productId, String planId) {
        ProductPlan plan = planRepository.findByIdAndProductId(planId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found or does not belong to this product"));

        if (!plan.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException("Access denied: Plan does not belong to your tenant");
        }

        return plan;
    }

    private void logAudit(Product product, ProductPlan plan, PlanAuditAction action, String performedBy, String details) {
        PlanAuditLog audit = new PlanAuditLog();
        audit.setId("palog_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setTenant(product.getTenant());
        audit.setProduct(product);
        audit.setPlan(plan);
        audit.setAction(action);
        audit.setPerformedBy(performedBy != null ? performedBy : "system");
        audit.setDetails(details);
        auditLogRepository.save(audit);
    }

    // DTOs for safe public response
    public static class PublicPlanResponse {
        private final String id;
        private final String name;
        private final String description;
        private final BigDecimal price;
        private final String currency;
        private final String billingInterval;
        private final int trialDays;
        private final List<PublicFeatureResponse> features;

        public PublicPlanResponse(String id, String name, String description, BigDecimal price,
                                  String currency, String billingInterval, int trialDays,
                                  List<PublicFeatureResponse> features) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.price = price;
            this.currency = currency;
            this.billingInterval = billingInterval;
            this.trialDays = trialDays;
            this.features = features;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public BigDecimal getPrice() { return price; }
        public String getCurrency() { return currency; }
        public String getBillingInterval() { return billingInterval; }
        public int getTrialDays() { return trialDays; }
        public List<PublicFeatureResponse> getFeatures() { return features; }
    }

    public static class PublicFeatureResponse {
        private final String featureKey;
        private final String featureName;
        private final String value;
        private final String valueType;

        public PublicFeatureResponse(String featureKey, String featureName, String value, String valueType) {
            this.featureKey = featureKey;
            this.featureName = featureName;
            this.value = value;
            this.valueType = valueType;
        }

        public String getFeatureKey() { return featureKey; }
        public String getFeatureName() { return featureName; }
        public String getValue() { return value; }
        public String getValueType() { return valueType; }
    }
}
