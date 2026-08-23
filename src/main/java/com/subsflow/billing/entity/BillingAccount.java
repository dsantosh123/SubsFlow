package com.subsflow.billing.entity;

import com.subsflow.customer.entity.Customer;
import com.subsflow.product.entity.Product;
import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "billing_account", uniqueConstraints = {
    @UniqueConstraint(name = "uq_billing_account_cust_prod", columnNames = {"product_id", "customer_id"})
})
@Getter
@Setter
public class BillingAccount {

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

    @Column(nullable = false, length = 50)
    private String provider = "SANDBOX";

    @Column(name = "provider_customer_id", length = 100)
    private String providerCustomerId;

    @Column(name = "billing_email")
    private String billingEmail;

    @Column(nullable = false, length = 10)
    private String currency = "USD";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
