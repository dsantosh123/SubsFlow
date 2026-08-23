package com.subsflow.plan.controller;

import com.subsflow.plan.service.ProductPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public/products/{productId}/plans")
public class PublicPlanCatalogController {

    private final ProductPlanService planService;

    public PublicPlanCatalogController(ProductPlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public ResponseEntity<?> getPublicPlans(@PathVariable("productId") String productId) {
        try {
            List<ProductPlanService.PublicPlanResponse> publicPlans = planService.getPublicPlansForProduct(productId);
            return ResponseEntity.ok(publicPlans);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
