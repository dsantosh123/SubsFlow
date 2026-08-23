package com.subsflow.events.entity;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.product.entity.Product;
import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "customer_usage_event", uniqueConstraints = {
    @UniqueConstraint(name = "uq_usage_event_idem", columnNames = {"tenant_id", "idempotency_key"})
})
@Getter
@Setter
public class CustomerUsageEvent {

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
    @JoinColumn(name = "subscription_id", nullable = false)
    private CustomerSubscription subscription;

    @Column(name = "feature_key", nullable = false, length = 100)
    private String featureKey;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "idempotency_key", length = 255)
    private String idempotencyKey;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
