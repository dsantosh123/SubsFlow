package com.subsflow.billing.repository;

import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerPaymentRepository extends JpaRepository<CustomerPayment, String> {
    List<CustomerPayment> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<CustomerPayment> findAllByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<CustomerPayment> findAllBySubscriptionIdOrderByCreatedAtDesc(String subscriptionId);
    Optional<CustomerPayment> findByIdAndProductId(String id, String productId);
    Optional<CustomerPayment> findByProviderAndProviderPaymentId(String provider, String providerPaymentId);
    long countByProductId(String productId);
    long countByProductIdAndStatus(String productId, PaymentStatus status);
}
