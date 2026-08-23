package com.subsflow.admin.service;

import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminDashboardService {

    private final TenantRepository tenantRepository;

    public AdminDashboardService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countByStatus(TenantStatus.ACTIVE);
        long suspendedTenants = tenantRepository.countByStatus(TenantStatus.SUSPENDED);

        // New tenants in the last 30 days
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now().minusDays(30);
        long newTenants = tenantRepository.countByCreatedAtAfter(thirtyDaysAgo);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTenants", totalTenants);
        stats.put("activeTenants", activeTenants);
        stats.put("suspendedTenants", suspendedTenants);
        stats.put("newTenants", newTenants);

        return stats;
    }
}
