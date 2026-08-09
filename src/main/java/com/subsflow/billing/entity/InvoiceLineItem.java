package com.subsflow.billing.entity;

import com.subsflow.common.entity.AbstractTenantEntity;
import com.subsflow.subscription.entity.BillingPlan;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "invoice_line_item")
@Getter
@Setter
public class InvoiceLineItem extends AbstractTenantEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private BillingPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceLineItemType type;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal amount;

    @Column
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
