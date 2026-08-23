package com.subsflow.events.repository;

import com.subsflow.events.entity.CustomerUsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerUsageEventRepository extends JpaRepository<CustomerUsageEvent, String> {
    List<CustomerUsageEvent> findAllByProductIdOrderByOccurredAtDesc(String productId);
    List<CustomerUsageEvent> findAllByCustomerIdOrderByOccurredAtDesc(String customerId);
    List<CustomerUsageEvent> findAllBySubscriptionIdOrderByOccurredAtDesc(String subscriptionId);
    boolean existsByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);
    long countByProductId(String productId);

    @Query("SELECT u.featureKey, SUM(u.quantity) FROM CustomerUsageEvent u WHERE u.product.id = :productId GROUP BY u.featureKey")
    List<Object[]> sumQuantityByProductGroupByFeature(@Param("productId") String productId);
}
