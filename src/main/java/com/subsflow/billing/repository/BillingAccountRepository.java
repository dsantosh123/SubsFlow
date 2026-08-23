package com.subsflow.billing.repository;

import com.subsflow.billing.entity.BillingAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BillingAccountRepository extends JpaRepository<BillingAccount, String> {
    Optional<BillingAccount> findByProductIdAndCustomerId(String productId, String customerId);
}
