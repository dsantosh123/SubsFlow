package com.subsflow.analytics.controller;

import com.subsflow.analytics.service.AnalyticsService;
import com.subsflow.common.context.TenantContext;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products/{productId}/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverviewMetrics(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Map<String, Object> metrics = analyticsService.getOverviewMetrics(tenantId, productId);
            return ResponseEntity.ok(metrics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenueMetrics(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Map<String, Object> revenue = analyticsService.getRevenueMetrics(tenantId, productId);
            return ResponseEntity.ok(revenue);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getPlanPerformance(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            List<Map<String, Object>> plans = analyticsService.getPlanPerformance(tenantId, productId);
            return ResponseEntity.ok(plans);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getPaymentMetrics(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Map<String, Object> payments = analyticsService.getPaymentMetrics(tenantId, productId);
            return ResponseEntity.ok(payments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/export/{reportType}")
    public void exportReport(@PathVariable("productId") String productId,
                             @PathVariable("reportType") String reportType,
                             HttpServletResponse response) throws IOException {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthenticated session");
            return;
        }

        String csvContent;
        String filename = reportType.toLowerCase() + "-export.csv";

        try {
            switch (reportType.toLowerCase()) {
                case "customers":
                    csvContent = analyticsService.exportCustomersCsv(tenantId, productId);
                    break;
                case "subscriptions":
                    csvContent = analyticsService.exportSubscriptionsCsv(tenantId, productId);
                    break;
                case "payments":
                    csvContent = analyticsService.exportPaymentsCsv(tenantId, productId);
                    break;
                case "usage":
                    csvContent = analyticsService.exportUsageCsv(tenantId, productId);
                    break;
                default:
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown report type: " + reportType);
                    return;
            }

            response.setContentType("text/csv");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            response.getWriter().write(csvContent);
            response.getWriter().flush();
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        }
    }
}
