package com.subsflow.billing.entity;

import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_refund")
@Getter
@Setter
public class PaymentRefund {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_id", nullable = false)
    private CustomerPayment payment;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(length = 255)
    private String reason;

    @Column(name = "performed_by", length = 255)
    private String performedBy;

    @Column(name = "provider_refund_id", length = 100)
    private String providerRefundId;

    @Column(nullable = false, length = 20)
    private String status = "SUCCEEDED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
