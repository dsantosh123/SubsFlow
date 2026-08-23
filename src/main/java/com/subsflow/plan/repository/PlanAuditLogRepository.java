package com.subsflow.plan.repository;

import com.subsflow.plan.entity.PlanAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanAuditLogRepository extends JpaRepository<PlanAuditLog, String> {
    List<PlanAuditLog> findAllByPlanIdOrderByCreatedAtDesc(String planId);
    List<PlanAuditLog> findAllByProductIdOrderByCreatedAtDesc(String productId);
}
