package com.subsflow.customer.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.customer.service.CustomerSubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/products/{productId}/dashboard")
public class ProductDashboardController {

    private final CustomerSubscriptionService subscriptionService;

    public ProductDashboardController(CustomerSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<?> getDashboardMetrics(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Map<String, Object> metrics = subscriptionService.getProductDashboardMetrics(tenantId, productId);
            return ResponseEntity.ok(metrics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
