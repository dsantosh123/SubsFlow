package com.subsflow.admin.service;

import com.subsflow.admin.entity.AdminAuditLog;
import com.subsflow.admin.repository.AdminAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class AdminAuditService {

    private final AdminAuditLogRepository auditLogRepository;

    public AdminAuditService(AdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAction(String adminId, String adminEmail, String action, String targetId, String details) {
        AdminAuditLog log = new AdminAuditLog();
        log.setId("log_" + UUID.randomUUID().toString().substring(0, 8));
        log.setAdminId(adminId != null ? adminId : "system");
        log.setAdminEmail(adminEmail != null ? adminEmail : "system@subsflow.com");
        log.setAction(action);
        log.setTargetId(targetId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> getRecentLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> getLogsByTarget(String targetId) {
        return auditLogRepository.findByTargetIdOrderByCreatedAtDesc(targetId);
    }
}
