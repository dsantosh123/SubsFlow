package com.subsflow.admin.service;

import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Set;

@Service
public class AdminTenantService {

    private final TenantRepository tenantRepository;
    private final AdminAuditService auditService;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "status", "createdAt");

    public AdminTenantService(TenantRepository tenantRepository, AdminAuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<Tenant> listTenants(String search, String status, int page, int size, String sortBy, String sortDir) {
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sorting by field '" + sortBy + "' is not allowed.");
        }

        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));

        TenantStatus tenantStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                tenantStatus = TenantStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tenant status: " + status);
            }
        }

        String searchPattern = (search != null) ? search.trim() : "";
        return tenantRepository.findAllWithSearchAndFilter(searchPattern, tenantStatus, pageRequest);
    }

    @Transactional(readOnly = true)
    public Tenant getTenantDetails(String tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found: " + tenantId));
    }

    @Transactional
    public Tenant updateTenantStatus(String tenantId, String newStatus, String adminId, String adminEmail) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found: " + tenantId));

        TenantStatus status;
        try {
            status = TenantStatus.valueOf(newStatus.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + newStatus);
        }

        if (tenant.getStatus() == status) {
            return tenant; // No change needed
        }

        TenantStatus oldStatus = tenant.getStatus();
        tenant.setStatus(status);
        Tenant updated = tenantRepository.save(tenant);

        String action = (status == TenantStatus.ACTIVE) ? "ACTIVATE_TENANT" : "SUSPEND_TENANT";
        auditService.logAction(
            adminId,
            adminEmail,
            action,
            tenantId,
            String.format("Updated status from %s to %s", oldStatus, status)
        );

        return updated;
    }
}
