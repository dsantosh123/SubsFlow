package com.subsflow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AuditLogResponse {
    private String id;
    private String adminId;
    private String adminEmail;
    private String action;
    private String targetId;
    private String details;
    private OffsetDateTime createdAt;
}
