package com.subsflow.billing.repository;

import com.subsflow.billing.entity.CustomerInvoice;
import com.subsflow.billing.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerInvoiceRepository extends JpaRepository<CustomerInvoice, String> {
    List<CustomerInvoice> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<CustomerInvoice> findAllByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<CustomerInvoice> findAllBySubscriptionIdOrderByCreatedAtDesc(String subscriptionId);
    Optional<CustomerInvoice> findByIdAndProductId(String id, String productId);
    long countByProductId(String productId);
    long countByProductIdAndStatus(String productId, InvoiceStatus status);
}
