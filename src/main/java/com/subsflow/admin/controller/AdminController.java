package com.subsflow.admin.controller;

import com.subsflow.admin.dto.*;
import com.subsflow.admin.entity.AdminAuditLog;
import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.admin.service.*;
import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.tenant.entity.Tenant;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
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
    private final AdminManagementService managementService;
    private final AdminSearchService searchService;
    private final AdminSystemService systemService;
    private final AdminOperationsService operationsService;
    private final AdminExportService exportService;

    public AdminController(AdminAuthService authService,
                           AdminDashboardService dashboardService,
                           AdminTenantService tenantService,
                           AdminAuditService auditService,
                           AdminManagementService managementService,
                           AdminSearchService searchService,
                           AdminSystemService systemService,
                           AdminOperationsService operationsService,
                           AdminExportService exportService) {
        this.authService = authService;
        this.dashboardService = dashboardService;
        this.tenantService = tenantService;
        this.auditService = auditService;
        this.managementService = managementService;
        this.searchService = searchService;
        this.systemService = systemService;
        this.operationsService = operationsService;
        this.exportService = exportService;
    }

    // ── Authentication ──────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request) {
        java.util.Optional<String> tokenOpt = authService.login(request.getEmail(), request.getPassword());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid admin credentials or account disabled"));
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

    // ── Dashboard Overview ──────────────────────────────────────

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

    // ── Tenant Lifecycle & Directory ───────────────────────────

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

    @GetMapping("/tenants/{tenantId}/support-overview")
    public ResponseEntity<?> getTenantSupportOverview(@PathVariable String tenantId) {
        try {
            Map<String, Object> overview = operationsService.getTenantSupportOverview(tenantId);
            return ResponseEntity.ok(overview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    // ── Internal Admin User Management ─────────────────────────

    @GetMapping("/admins")
    public ResponseEntity<List<Map<String, Object>>> listAdmins() {
        return ResponseEntity.ok(managementService.listAdmins());
    }

    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(
            @RequestBody Map<String, String> body,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        try {
            PlatformAdmin created = managementService.createAdmin(
                    body.get("name"),
                    body.get("email"),
                    body.get("password"),
                    body.get("role"),
                    adminId,
                    adminEmail
            );
            return ResponseEntity.ok(Map.of(
                    "id", created.getId(),
                    "email", created.getEmail(),
                    "name", created.getName(),
                    "role", created.getRole(),
                    "status", created.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admins/{targetAdminId}/status")
    public ResponseEntity<?> updateAdminStatus(
            @PathVariable String targetAdminId,
            @RequestBody Map<String, String> body,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        try {
            PlatformAdmin updated = managementService.updateStatus(targetAdminId, body.get("status"), adminId, adminEmail);
            return ResponseEntity.ok(Map.of("id", updated.getId(), "status", updated.getStatus()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admins/{targetAdminId}/role")
    public ResponseEntity<?> updateAdminRole(
            @PathVariable String targetAdminId,
            @RequestBody Map<String, String> body,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        try {
            PlatformAdmin updated = managementService.updateRole(targetAdminId, body.get("role"), adminId, adminEmail);
            return ResponseEntity.ok(Map.of("id", updated.getId(), "role", updated.getRole()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admins/{targetAdminId}/reset-password")
    public ResponseEntity<?> resetAdminPassword(
            @PathVariable String targetAdminId,
            @RequestBody Map<String, String> body,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        try {
            managementService.resetPassword(targetAdminId, body.get("password"), adminId, adminEmail);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Universal Cross-Tenant Search ──────────────────────────

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(searchService.globalSearch(q));
    }

    // ── System Health & Integrations ───────────────────────────

    @GetMapping("/system/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(systemService.getSystemHealth());
    }

    @GetMapping("/system/integrations")
    public ResponseEntity<List<Map<String, Object>>> getIntegrations() {
        return ResponseEntity.ok(systemService.getIntegrations());
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getPlatformSettings() {
        return ResponseEntity.ok(systemService.getPlatformSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, String>> updatePlatformSettings(
            @RequestBody Map<String, String> updates,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        return ResponseEntity.ok(systemService.updatePlatformSettings(updates, adminId, adminEmail));
    }

    // ── Platform-Wide Explorers ────────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<List<Map<String, Object>>> listAllProducts() {
        return ResponseEntity.ok(operationsService.listAllProducts());
    }

    @GetMapping("/customers")
    public ResponseEntity<List<Map<String, Object>>> listAllCustomers() {
        return ResponseEntity.ok(operationsService.listAllCustomers());
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<Map<String, Object>>> listAllSubscriptions() {
        return ResponseEntity.ok(operationsService.listAllSubscriptions());
    }

    @GetMapping("/billing/payments")
    public ResponseEntity<List<Map<String, Object>>> listAllPayments() {
        return ResponseEntity.ok(operationsService.listAllPayments());
    }

    @GetMapping("/webhooks/deliveries")
    public ResponseEntity<List<WebhookDelivery>> listAllWebhookDeliveries() {
        return ResponseEntity.ok(operationsService.listAllWebhookDeliveries());
    }

    @PostMapping("/webhooks/deliveries/{deliveryId}/retry")
    public ResponseEntity<?> retryWebhookDelivery(
            @PathVariable String deliveryId,
            @RequestAttribute("adminId") String adminId,
            @RequestAttribute("adminEmail") String adminEmail) {
        try {
            WebhookDelivery retried = operationsService.retryWebhookDelivery(deliveryId, adminId, adminEmail);
            return ResponseEntity.ok(retried);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Audit Trail ───────────────────────────────────────────

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

    // ── Platform Server-Side CSV Exports ───────────────────────

    @GetMapping("/export/{reportType}")
    public void exportReport(@PathVariable String reportType, HttpServletResponse response) throws IOException {
        String csvContent;
        String filename = "admin-" + reportType.toLowerCase() + "-export.csv";

        switch (reportType.toLowerCase()) {
            case "tenants":
                csvContent = exportService.exportTenantsCsv();
                break;
            case "customers":
                csvContent = exportService.exportCustomersCsv();
                break;
            case "subscriptions":
                csvContent = exportService.exportSubscriptionsCsv();
                break;
            case "payments":
                csvContent = exportService.exportPaymentsCsv();
                break;
            case "audit-logs":
                csvContent = exportService.exportAuditLogsCsv();
                break;
            default:
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown report type: " + reportType);
                return;
        }

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        response.getWriter().write(csvContent);
        response.getWriter().flush();
    }
}
