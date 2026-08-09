package com.subsflow.billing.entity;

import com.subsflow.common.entity.AbstractTenantEntity;
import com.subsflow.subscription.entity.Subscription;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usage_event")
@Getter
@Setter
public class UsageEvent extends AbstractTenantEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal quantity;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private OffsetDateTime timestamp;
}
