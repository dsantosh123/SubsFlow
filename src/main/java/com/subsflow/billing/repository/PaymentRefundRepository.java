package com.subsflow.billing.repository;

import com.subsflow.billing.entity.PaymentRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, String> {
    List<PaymentRefund> findAllByPaymentIdOrderByCreatedAtDesc(String paymentId);
}
