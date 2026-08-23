package com.subsflow.product.repository;

import com.subsflow.product.entity.ProductAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductAuditLogRepository extends JpaRepository<ProductAuditLog, String> {
    List<ProductAuditLog> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<ProductAuditLog> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);
}
