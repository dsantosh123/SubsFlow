package com.subsflow.events.service;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.events.entity.CustomerUsageEvent;
import com.subsflow.events.repository.CustomerUsageEventRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class UsageTrackingService {

    private final CustomerUsageEventRepository usageRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public UsageTrackingService(CustomerUsageEventRepository usageRepository,
                                CustomerSubscriptionRepository subscriptionRepository,
                                CustomerRepository customerRepository,
                                ProductRepository productRepository) {
        this.usageRepository = usageRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CustomerUsageEvent recordUsage(String tenantId, String userRole, String actorEmail,
                                          String productId, String customerId, String subscriptionId,
                                          String featureKey, BigDecimal quantity, String idempotencyKey,
                                          OffsetDateTime occurredAt, String metadataJson) {
        validateReadOrWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);
        Customer customer = customerRepository.findByIdAndProductId(customerId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (sub.getStatus() == CustomerSubscriptionStatus.CANCELLED || sub.getStatus() == CustomerSubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Cannot record usage for a " + sub.getStatus() + " subscription");
        }

        if (featureKey == null || featureKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Feature key is required");
        }

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            if (usageRepository.existsByTenantIdAndIdempotencyKey(tenantId, idempotencyKey.trim())) {
                // Idempotent duplicate: return latest usage without double counting
                List<CustomerUsageEvent> existing = usageRepository.findAllBySubscriptionIdOrderByOccurredAtDesc(sub.getId());
                if (!existing.isEmpty()) return existing.get(0);
            }
        }

        CustomerUsageEvent event = new CustomerUsageEvent();
        event.setId("use_" + UUID.randomUUID().toString().substring(0, 8));
        event.setTenant(product.getTenant());
        event.setProduct(product);
        event.setCustomer(customer);
        event.setSubscription(sub);
        event.setFeatureKey(featureKey.trim());
        event.setQuantity(quantity);
        event.setIdempotencyKey(idempotencyKey != null && !idempotencyKey.trim().isEmpty() ? idempotencyKey.trim() : null);
        event.setOccurredAt(occurredAt != null ? occurredAt : OffsetDateTime.now());
        event.setMetadataJson(metadataJson);

        return usageRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<CustomerUsageEvent> listUsageEvents(String tenantId, String productId, String customerId, String subscriptionId) {
        validateProductBelongsToTenant(tenantId, productId);
        if (subscriptionId != null && !subscriptionId.trim().isEmpty()) {
            return usageRepository.findAllBySubscriptionIdOrderByOccurredAtDesc(subscriptionId);
        }
        if (customerId != null && !customerId.trim().isEmpty()) {
            return usageRepository.findAllByCustomerIdOrderByOccurredAtDesc(customerId);
        }
        return usageRepository.findAllByProductIdOrderByOccurredAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAggregatedUsage(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<Object[]> grouped = usageRepository.sumQuantityByProductGroupByFeature(productId);

        Map<String, BigDecimal> byFeature = new LinkedHashMap<>();
        BigDecimal totalUnits = BigDecimal.ZERO;
        for (Object[] row : grouped) {
            String feat = (String) row[0];
            BigDecimal qty = (BigDecimal) row[1];
            byFeature.put(feat, qty);
            totalUnits = totalUnits.add(qty);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("productId", productId);
        res.put("totalQuantity", totalUnits);
        res.put("totalEventsCount", usageRepository.countByProductId(productId));
        res.put("byFeature", byFeature);
        return res;
    }

    private void validateReadOrWritePermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}
