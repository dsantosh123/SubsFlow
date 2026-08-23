package com.subsflow.admin.controller;

import com.subsflow.admin.dto.*;
import com.subsflow.admin.entity.AdminAuditLog;
import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.admin.service.*;
import com.subsflow.tenant.entity.Tenant;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAuthService authService;
    private final AdminDashboardService dashboardService;
    private final AdminTenantService tenantService;
    private final AdminAuditService auditService;

    public AdminController(AdminAuthService authService,
                           AdminDashboardService dashboardService,
                           AdminTenantService tenantService,
                           AdminAuditService auditService) {
        this.authService = authService;
        this.dashboardService = dashboardService;
        this.tenantService = tenantService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request) {
        java.util.Optional<String> tokenOpt = authService.login(request.getEmail(), request.getPassword());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid admin email or password"));
        }

        String token = tokenOpt.get();
        PlatformAdmin admin = authService.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Admin record missing"));

        AdminLoginResponse response = new AdminLoginResponse(
                token,
                "Bearer",
                86400000L, // 24 Hours
                admin.getId(),
                admin.getEmail(),
                admin.getName()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard() {
        Map<String, Object> stats = dashboardService.getDashboardStats();
        DashboardStatsResponse response = new DashboardStatsResponse(
                (long) stats.get("totalTenants"),
                (long) stats.get("activeTenants"),
                (long) stats.get("suspendedTenants"),
                (long) stats.get("newTenants")
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenants")
    public ResponseEntity<Page<Tenant>> listTenants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Page<Tenant> tenants = tenantService.listTenants(search, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/tenants/{tenantId}")
    public ResponseEntity<Tenant> getTenant(@PathVariable String tenantId) {
        Tenant tenant = tenantService.getTenantDetails(tenantId);
        return ResponseEntity.ok(tenant);
    }

    @PatchMapping("/tenants/{tenantId}/status")
    public ResponseEntity<Tenant> updateTenantStatus(
            @PathVariable String tenantId,
            @Valid @RequestBody TenantStatusUpdateRequest request,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        
        Tenant updated = tenantService.updateTenantStatus(tenantId, request.getStatus(), adminId, adminEmail);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs() {
        List<AdminAuditLog> logs = auditService.getRecentLogs();
        List<AuditLogResponse> response = logs.stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getAdminId(),
                        log.getAdminEmail(),
                        log.getAction(),
                        log.getTargetId(),
                        log.getDetails(),
                        log.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
