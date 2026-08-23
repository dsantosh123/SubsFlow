package com.subsflow.admin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "admin_audit_log")
@Getter
@Setter
public class AdminAuditLog {

    @Id
    private String id;

    @Column(name = "admin_id", nullable = false)
    private String adminId;

    @Column(name = "admin_email", nullable = false)
    private String adminEmail;

    @Column(nullable = false)
    private String action;

    @Column(name = "target_id", nullable = false)
    private String targetId;

    @Column
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
