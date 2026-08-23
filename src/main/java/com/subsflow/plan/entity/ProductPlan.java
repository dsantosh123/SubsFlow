package com.subsflow.plan.entity;

import com.subsflow.product.entity.Product;
import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_plan", uniqueConstraints = {
    @UniqueConstraint(name = "uq_product_plan_product_name", columnNames = {"product_id", "name"})
})
@Getter
@Setter
public class ProductPlan {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanStatus status = PlanStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanVisibility visibility = PlanVisibility.PUBLIC;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(nullable = false, length = 10)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_interval", nullable = false)
    private BillingInterval billingInterval = BillingInterval.MONTHLY;

    @Column(name = "trial_days", nullable = false)
    private int trialDays = 0;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(nullable = false)
    private Long version = 1L;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    private List<PlanFeature> features = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
