package com.subsflow.customer.repository;

import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerSubscriptionRepository extends JpaRepository<CustomerSubscription, String> {

    List<CustomerSubscription> findAllByProductIdOrderByCreatedAtDesc(String productId);

    List<CustomerSubscription> findAllByCustomerIdOrderByCreatedAtDesc(String customerId);

    Optional<CustomerSubscription> findByIdAndProductId(String id, String productId);

    long countByProductId(String productId);

    long countByProductIdAndStatus(String productId, CustomerSubscriptionStatus status);

    long countByCustomerId(String customerId);

    long countByCustomerIdAndStatus(String customerId, CustomerSubscriptionStatus status);

    @Query("SELECT s FROM CustomerSubscription s WHERE s.product.id = :productId " +
           "AND (:customerId IS NULL OR s.customer.id = :customerId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:planId IS NULL OR s.plan.id = :planId) " +
           "ORDER BY s.createdAt DESC")
    List<CustomerSubscription> findFilteredSubscriptions(@Param("productId") String productId,
                                                         @Param("customerId") String customerId,
                                                         @Param("status") CustomerSubscriptionStatus status,
                                                         @Param("planId") String planId);
}
