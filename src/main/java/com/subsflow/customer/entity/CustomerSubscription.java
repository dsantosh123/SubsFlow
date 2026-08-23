package com.subsflow.customer.entity;

import com.subsflow.plan.entity.ProductPlan;
import com.subsflow.product.entity.Product;
import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "customer_subscription")
@Getter
@Setter
public class CustomerSubscription {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private ProductPlan plan;

    @Column(name = "plan_version", nullable = false)
    private Long planVersion = 1L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerSubscriptionStatus status;

    @Column(name = "price_at_subscription", nullable = false, precision = 20, scale = 4)
    private BigDecimal priceAtSubscription;

    @Column(name = "currency_at_subscription", nullable = false, length = 10)
    private String currencyAtSubscription;

    @Column(name = "billing_interval_at_subscription", nullable = false, length = 20)
    private String billingIntervalAtSubscription;

    @Column(name = "trial_days", nullable = false)
    private int trialDays = 0;

    @Column(name = "features_snapshot_json", columnDefinition = "TEXT")
    private String featuresSnapshotJson;

    @Column(name = "start_date", nullable = false)
    private OffsetDateTime startDate;

    @Column(name = "trial_end_date")
    private OffsetDateTime trialEndDate;

    @Column(name = "current_period_start", nullable = false)
    private OffsetDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private OffsetDateTime currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd = false;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "ended_at")
    private OffsetDateTime endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
