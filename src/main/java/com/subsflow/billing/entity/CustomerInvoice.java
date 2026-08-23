package com.subsflow.billing.entity;

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
@Table(name = "customer_invoice", uniqueConstraints = {
    @UniqueConstraint(name = "uq_customer_invoice_num", columnNames = {"tenant_id", "invoice_number"})
})
@Getter
@Setter
public class CustomerInvoice {

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

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.OPEN;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal total;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "billing_period_start", nullable = false)
    private OffsetDateTime billingPeriodStart;

    @Column(name = "billing_period_end", nullable = false)
    private OffsetDateTime billingPeriodEnd;

    @Column(name = "due_date", nullable = false)
    private OffsetDateTime dueDate;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
