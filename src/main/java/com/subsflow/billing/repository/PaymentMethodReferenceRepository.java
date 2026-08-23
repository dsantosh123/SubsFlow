package com.subsflow.billing.repository;

import com.subsflow.billing.entity.PaymentMethodReference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentMethodReferenceRepository extends JpaRepository<PaymentMethodReference, String> {
    List<PaymentMethodReference> findAllByCustomerIdOrderByCreatedAtDesc(String customerId);
    Optional<PaymentMethodReference> findByCustomerIdAndIsDefaultTrue(String customerId);
}
