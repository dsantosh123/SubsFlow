package com.subsflow.admin.repository;

import com.subsflow.admin.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, String> {
    List<AdminAuditLog> findAllByOrderByCreatedAtDesc();
    List<AdminAuditLog> findByTargetIdOrderByCreatedAtDesc(String targetId);
}
