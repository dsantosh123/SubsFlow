package com.subsflow.billing.entity;

import com.subsflow.customer.entity.Customer;
import com.subsflow.product.entity.Product;
import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_method_reference")
@Getter
@Setter
public class PaymentMethodReference {

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

    @Column(name = "provider_payment_method_id", nullable = false, length = 100)
    private String providerPaymentMethodId;

    @Column(nullable = false, length = 50)
    private String type = "CARD";

    @Column(length = 4)
    private String last4;

    @Column(length = 50)
    private String brand;

    @Column(name = "exp_month")
    private Integer expMonth;

    @Column(name = "exp_year")
    private Integer expYear;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
