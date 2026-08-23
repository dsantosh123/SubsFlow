package com.subsflow.customer.repository;

import com.subsflow.customer.entity.SubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, String> {
    List<SubscriptionHistory> findAllBySubscriptionIdOrderByCreatedAtDesc(String subscriptionId);
    List<SubscriptionHistory> findAllByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<SubscriptionHistory> findAllByProductIdOrderByCreatedAtDesc(String productId);
}
