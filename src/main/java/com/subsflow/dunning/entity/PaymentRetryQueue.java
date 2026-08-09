package com.subsflow.dunning.entity;

import com.subsflow.common.entity.AbstractTenantEntity;
import com.subsflow.payment.entity.PaymentTransaction;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_retry_queue")
@Getter
@Setter
public class PaymentRetryQueue extends AbstractTenantEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private PaymentTransaction transaction;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "next_retry_at", nullable = false)
    private OffsetDateTime nextRetryAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RetryStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
