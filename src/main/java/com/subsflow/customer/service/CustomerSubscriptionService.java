package com.subsflow.customer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.customer.entity.*;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.customer.repository.SubscriptionHistoryRepository;
import com.subsflow.plan.entity.BillingInterval;
import com.subsflow.plan.entity.PlanFeature;
import com.subsflow.plan.entity.PlanStatus;
import com.subsflow.plan.entity.PlanVisibility;
import com.subsflow.plan.entity.ProductPlan;
import com.subsflow.plan.repository.ProductPlanRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomerSubscriptionService {

    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final ProductPlanRepository planRepository;
    private final ProductRepository productRepository;
    private final SubscriptionHistoryRepository historyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.subsflow.events.service.OutboundWebhookService outboundWebhookService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.subsflow.events.service.NotificationService notificationService;

    public CustomerSubscriptionService(CustomerSubscriptionRepository subscriptionRepository,
                                       CustomerRepository customerRepository,
                                       ProductPlanRepository planRepository,
                                       ProductRepository productRepository,
                                       SubscriptionHistoryRepository historyRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.customerRepository = customerRepository;
        this.planRepository = planRepository;
        this.productRepository = productRepository;
        this.historyRepository = historyRepository;
    }

    public void setOutboundWebhookService(com.subsflow.events.service.OutboundWebhookService outboundWebhookService) {
        this.outboundWebhookService = outboundWebhookService;
    }

    public void setNotificationService(com.subsflow.events.service.NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Transactional
    public CustomerSubscription createSubscription(String tenantId, String userRole, String actorEmail,
                                                  String productId, String customerId, String planId) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        Customer customer = customerRepository.findByIdAndProductId(customerId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found or does not belong to this product"));

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalStateException("Cannot create subscription for an INACTIVE customer");
        }

        ProductPlan plan = planRepository.findByIdAndProductId(planId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found or does not belong to this product"));

        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new IllegalStateException("Cannot subscribe to plan with status " + plan.getStatus() + ". Only ACTIVE plans are available.");
        }
        if (plan.getVisibility() != PlanVisibility.PUBLIC) {
            throw new IllegalStateException("Cannot subscribe to PRIVATE plan directly");
        }

        OffsetDateTime now = OffsetDateTime.now();
        CustomerSubscriptionStatus initialStatus;
        OffsetDateTime trialEndDate = null;
        OffsetDateTime periodEnd;

        if (plan.getTrialDays() > 0) {
            initialStatus = CustomerSubscriptionStatus.TRIALING;
            trialEndDate = now.plusDays(plan.getTrialDays());
            periodEnd = trialEndDate;
        } else {
            initialStatus = CustomerSubscriptionStatus.ACTIVE;
            periodEnd = plan.getBillingInterval() == BillingInterval.YEARLY
                    ? now.plusYears(1) : now.plusMonths(1);
        }

        CustomerSubscription sub = new CustomerSubscription();
        sub.setId("sub_" + UUID.randomUUID().toString().substring(0, 8));
        sub.setTenant(product.getTenant());
        sub.setProduct(product);
        sub.setCustomer(customer);
        sub.setPlan(plan);
        sub.setPlanVersion(plan.getVersion() != null ? plan.getVersion() : 1L);
        sub.setStatus(initialStatus);
        sub.setPriceAtSubscription(plan.getPrice());
        sub.setCurrencyAtSubscription(plan.getCurrency());
        sub.setBillingIntervalAtSubscription(plan.getBillingInterval().name());
        sub.setTrialDays(plan.getTrialDays());
        sub.setFeaturesSnapshotJson(snapshotFeatures(plan.getFeatures()));
        sub.setStartDate(now);
        sub.setTrialEndDate(trialEndDate);
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(periodEnd);
        sub.setCancelAtPeriodEnd(false);

        sub = subscriptionRepository.save(sub);

        // Record history
        logHistory(sub, null, initialStatus.name(), null, plan.getId(),
                SubscriptionHistoryAction.SUBSCRIPTION_CREATED, actorEmail,
                "Subscription created on plan '" + plan.getName() + "' at " + plan.getCurrency() + " " + plan.getPrice());

        if (initialStatus == CustomerSubscriptionStatus.TRIALING) {
            logHistory(sub, null, initialStatus.name(), null, plan.getId(),
                    SubscriptionHistoryAction.TRIAL_STARTED, actorEmail,
                    "Trial started for " + plan.getTrialDays() + " days (ends " + trialEndDate + ")");
        }

        dispatchEvents(sub, "subscription.created", "Subscription Created",
                "Customer " + customer.getName() + " subscribed to " + plan.getName());

        return sub;
    }

    @Transactional(readOnly = true)
    public List<CustomerSubscription> listSubscriptions(String tenantId, String productId,
                                                        String customerId, CustomerSubscriptionStatus status,
                                                        String planId) {
        validateProductBelongsToTenant(tenantId, productId);
        return subscriptionRepository.findFilteredSubscriptions(productId, customerId, status, planId);
    }

    @Transactional(readOnly = true)
    public CustomerSubscription getSubscription(String tenantId, String productId, String subscriptionId) {
        validateProductBelongsToTenant(tenantId, productId);
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found or access denied"));

        if (!sub.getTenant().getId().equals(tenantId)) {
            throw new IllegalArgumentException("Access denied: Subscription belongs to another tenant");
        }
        return sub;
    }

    @Transactional
    public CustomerSubscription pauseSubscription(String tenantId, String userRole, String actorEmail,
                                                  String productId, String subscriptionId) {
        validateWritePermission(userRole);
        CustomerSubscription sub = getSubscription(tenantId, productId, subscriptionId);

        if (sub.getStatus() == CustomerSubscriptionStatus.PAUSED) {
            throw new IllegalStateException("Subscription is already PAUSED");
        }
        if (sub.getStatus() == CustomerSubscriptionStatus.CANCELLED || sub.getStatus() == CustomerSubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Cannot pause a " + sub.getStatus() + " subscription");
        }

        CustomerSubscriptionStatus prevStatus = sub.getStatus();
        sub.setStatus(CustomerSubscriptionStatus.PAUSED);
        sub = subscriptionRepository.save(sub);

        logHistory(sub, prevStatus.name(), CustomerSubscriptionStatus.PAUSED.name(),
                sub.getPlan().getId(), sub.getPlan().getId(),
                SubscriptionHistoryAction.SUBSCRIPTION_PAUSED, actorEmail,
                "Subscription paused by user");

        dispatchEvents(sub, "subscription.paused", "Subscription Paused",
                "Subscription for customer " + sub.getCustomer().getName() + " was paused.");

        return sub;
    }

    @Transactional
    public CustomerSubscription resumeSubscription(String tenantId, String userRole, String actorEmail,
                                                   String productId, String subscriptionId) {
        validateWritePermission(userRole);
        CustomerSubscription sub = getSubscription(tenantId, productId, subscriptionId);

        if (sub.getStatus() == CustomerSubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Subscription is already ACTIVE");
        }
        if (sub.getStatus() != CustomerSubscriptionStatus.PAUSED) {
            throw new IllegalStateException("Only PAUSED subscriptions can be resumed (current status: " + sub.getStatus() + ")");
        }

        CustomerSubscriptionStatus prevStatus = sub.getStatus();
        sub.setStatus(CustomerSubscriptionStatus.ACTIVE);
        sub = subscriptionRepository.save(sub);

        logHistory(sub, prevStatus.name(), CustomerSubscriptionStatus.ACTIVE.name(),
                sub.getPlan().getId(), sub.getPlan().getId(),
                SubscriptionHistoryAction.SUBSCRIPTION_RESUMED, actorEmail,
                "Subscription resumed to ACTIVE");

        dispatchEvents(sub, "subscription.resumed", "Subscription Resumed",
                "Subscription for customer " + sub.getCustomer().getName() + " was resumed to active.");

        return sub;
    }

    @Transactional
    public CustomerSubscription cancelSubscription(String tenantId, String userRole, String actorEmail,
                                                   String productId, String subscriptionId, boolean cancelAtPeriodEnd) {
        validateWritePermission(userRole);
        CustomerSubscription sub = getSubscription(tenantId, productId, subscriptionId);

        if (sub.getStatus() == CustomerSubscriptionStatus.CANCELLED || sub.getStatus() == CustomerSubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Subscription is already " + sub.getStatus());
        }

        CustomerSubscriptionStatus prevStatus = sub.getStatus();
        OffsetDateTime now = OffsetDateTime.now();

        if (cancelAtPeriodEnd) {
            sub.setCancelAtPeriodEnd(true);
            sub.setCancelledAt(now);
            sub = subscriptionRepository.save(sub);

            logHistory(sub, prevStatus.name(), sub.getStatus().name(),
                    sub.getPlan().getId(), sub.getPlan().getId(),
                    SubscriptionHistoryAction.CANCELLATION_REQUESTED, actorEmail,
                    "Cancellation scheduled at period end (" + sub.getCurrentPeriodEnd() + ")");
        } else {
            sub.setStatus(CustomerSubscriptionStatus.CANCELLED);
            sub.setCancelAtPeriodEnd(false);
            sub.setCancelledAt(now);
            sub.setEndedAt(now);
            sub = subscriptionRepository.save(sub);

            logHistory(sub, prevStatus.name(), CustomerSubscriptionStatus.CANCELLED.name(),
                    sub.getPlan().getId(), sub.getPlan().getId(),
                    SubscriptionHistoryAction.SUBSCRIPTION_CANCELLED, actorEmail,
                    "Subscription cancelled immediately");
        }

        dispatchEvents(sub, "subscription.cancelled", "Subscription Cancelled",
                "Subscription for customer " + sub.getCustomer().getName() + " has been cancelled.");

        return sub;
    }

    @Transactional
    public CustomerSubscription changePlan(String tenantId, String userRole, String actorEmail,
                                           String productId, String subscriptionId, String newPlanId) {
        validateWritePermission(userRole);
        CustomerSubscription sub = getSubscription(tenantId, productId, subscriptionId);

        if (sub.getStatus() == CustomerSubscriptionStatus.CANCELLED || sub.getStatus() == CustomerSubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Cannot change plan for a " + sub.getStatus() + " subscription");
        }

        if (sub.getPlan().getId().equals(newPlanId)) {
            throw new IllegalArgumentException("Subscription is already on plan '" + sub.getPlan().getName() + "'");
        }

        ProductPlan newPlan = planRepository.findByIdAndProductId(newPlanId, productId)
                .orElseThrow(() -> new IllegalArgumentException("New plan not found or does not belong to this product"));

        if (newPlan.getStatus() != PlanStatus.ACTIVE) {
            throw new IllegalStateException("Cannot switch to plan with status " + newPlan.getStatus() + ". Only ACTIVE plans are available.");
        }

        String prevPlanId = sub.getPlan().getId();
        String prevPlanName = sub.getPlan().getName();

        // Update plan reference and snapshot new plan rates & features
        sub.setPlan(newPlan);
        sub.setPlanVersion(newPlan.getVersion() != null ? newPlan.getVersion() : 1L);
        sub.setPriceAtSubscription(newPlan.getPrice());
        sub.setCurrencyAtSubscription(newPlan.getCurrency());
        sub.setBillingIntervalAtSubscription(newPlan.getBillingInterval().name());
        sub.setFeaturesSnapshotJson(snapshotFeatures(newPlan.getFeatures()));

        sub = subscriptionRepository.save(sub);

        logHistory(sub, sub.getStatus().name(), sub.getStatus().name(),
                prevPlanId, newPlan.getId(),
                SubscriptionHistoryAction.PLAN_CHANGED, actorEmail,
                "Changed plan from '" + prevPlanName + "' to '" + newPlan.getName() + "' ($" + newPlan.getPrice() + "/" + newPlan.getBillingInterval().name().toLowerCase() + ")");

        return sub;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionHistory> listHistory(String tenantId, String productId, String subscriptionId) {
        getSubscription(tenantId, productId, subscriptionId);
        return historyRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(subscriptionId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProductDashboardMetrics(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);

        long totalCustomers = customerRepository.countByProductId(productId);
        long activeCustomers = customerRepository.countByProductIdAndStatus(productId, CustomerStatus.ACTIVE);

        long totalSubscriptions = subscriptionRepository.countByProductId(productId);
        long activeSubscriptions = subscriptionRepository.countByProductIdAndStatus(productId, CustomerSubscriptionStatus.ACTIVE);
        long trialingSubscriptions = subscriptionRepository.countByProductIdAndStatus(productId, CustomerSubscriptionStatus.TRIALING);
        long pausedSubscriptions = subscriptionRepository.countByProductIdAndStatus(productId, CustomerSubscriptionStatus.PAUSED);
        long cancelledSubscriptions = subscriptionRepository.countByProductIdAndStatus(productId, CustomerSubscriptionStatus.CANCELLED);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("productId", productId);
        metrics.put("totalCustomers", totalCustomers);
        metrics.put("activeCustomers", activeCustomers);
        metrics.put("totalSubscriptions", totalSubscriptions);
        metrics.put("activeSubscriptions", activeSubscriptions);
        metrics.put("trialingSubscriptions", trialingSubscriptions);
        metrics.put("pausedSubscriptions", pausedSubscriptions);
        metrics.put("cancelledSubscriptions", cancelledSubscriptions);

        return metrics;
    }

    private String snapshotFeatures(List<PlanFeature> features) {
        if (features == null || features.isEmpty()) {
            return "[]";
        }
        List<Map<String, Object>> list = features.stream()
                .map(f -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("featureKey", f.getFeatureKey());
                    m.put("featureName", f.getFeatureName());
                    m.put("value", f.getValue());
                    m.put("valueType", f.getValueType().name());
                    return m;
                })
                .collect(Collectors.toList());

        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private void logHistory(CustomerSubscription sub, String prevStatus, String newStatus,
                            String prevPlanId, String newPlanId,
                            SubscriptionHistoryAction action, String performedBy, String details) {
        SubscriptionHistory history = new SubscriptionHistory();
        history.setId("subhist_" + UUID.randomUUID().toString().substring(0, 8));
        history.setTenant(sub.getTenant());
        history.setProduct(sub.getProduct());
        history.setSubscription(sub);
        history.setCustomer(sub.getCustomer());
        history.setPreviousStatus(prevStatus);
        history.setNewStatus(newStatus);
        history.setPreviousPlanId(prevPlanId);
        history.setNewPlanId(newPlanId);
        history.setAction(action);
        history.setPerformedBy(performedBy != null ? performedBy : "system");
        history.setDetails(details);
        historyRepository.save(history);
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) {
            throw new IllegalStateException("User role context is required");
        }
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can perform this action");
        }
    }

    private void dispatchEvents(CustomerSubscription sub, String eventType, String title, String message) {
        if (outboundWebhookService != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("subscriptionId", sub.getId());
            data.put("customerId", sub.getCustomer().getId());
            data.put("customerName", sub.getCustomer().getName());
            data.put("customerEmail", sub.getCustomer().getEmail());
            data.put("planId", sub.getPlan().getId());
            data.put("planName", sub.getPlan().getName());
            data.put("status", sub.getStatus().name());
            data.put("price", sub.getPriceAtSubscription());
            data.put("currency", sub.getCurrencyAtSubscription());
            outboundWebhookService.dispatchOutboundEvent(sub.getTenant(), sub.getProduct(), eventType, data);
        }
        if (notificationService != null) {
            notificationService.dispatchNotification(sub.getTenant(), sub.getProduct(), sub.getCustomer(), sub, eventType, title, message);
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}
