package com.subsflow.customer.entity;

import com.subsflow.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "idempotency_record", uniqueConstraints = {
    @UniqueConstraint(name = "uq_idempotency_tenant_key", columnNames = {"tenant_id", "idempotency_key"})
})
@Getter
@Setter
public class IdempotencyRecord {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType;

    @Column(name = "resource_id", length = 50)
    private String resourceId;

    @Column(name = "response_status", nullable = false)
    private int responseStatus;

    @Column(name = "response_body", nullable = false, columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
