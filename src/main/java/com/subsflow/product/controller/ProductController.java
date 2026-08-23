package com.subsflow.product.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductAuditLog;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.service.ProductCredentialService;
import com.subsflow.product.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final ProductCredentialService credentialService;

    public ProductController(ProductService productService, ProductCredentialService credentialService) {
        this.productService = productService;
        this.credentialService = credentialService;
    }

    @PostMapping
    public ResponseEntity<?> createProduct(HttpServletRequest request, @RequestBody CreateProductRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Product product = productService.createProduct(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    body.getName(),
                    body.getDescription(),
                    body.getWebsiteUrl()
            );

            return ResponseEntity.ok(mapProductToResponse(product));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listProducts() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        List<Product> products = productService.listProducts(tenantId);
        List<Map<String, Object>> response = products.stream()
                .map(this::mapProductToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Product product = productService.getProduct(tenantId, productId);
            return ResponseEntity.ok(mapProductToResponse(product));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(HttpServletRequest request,
                                           @PathVariable("id") String productId,
                                           @RequestBody UpdateProductRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Product product = productService.updateProduct(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    body.getName(),
                    body.getDescription(),
                    body.getWebsiteUrl()
            );

            return ResponseEntity.ok(mapProductToResponse(product));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> setProductStatus(HttpServletRequest request,
                                              @PathVariable("id") String productId,
                                              @RequestBody StatusUpdateRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            ProductStatus status = ProductStatus.valueOf(body.getStatus().toUpperCase());
            Product product = productService.setProductStatus(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    status
            );

            return ResponseEntity.ok(mapProductToResponse(product));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/credentials")
    public ResponseEntity<?> getCredentials(@PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Map<String, Object> metadata = credentialService.getCredentialMetadata(tenantId, productId);
            return ResponseEntity.ok(metadata);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/credentials")
    public ResponseEntity<?> generateCredentials(HttpServletRequest request, @PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        validateCredentialManagementPermission(role);

        try {
            ProductCredentialService.CredentialGeneratedResponse cred =
                    credentialService.generateCredentials(tenantId, productId, email != null ? email : "system");

            return ResponseEntity.ok(Map.of(
                    "id", cred.getId(),
                    "clientId", cred.getClientId(),
                    "clientSecret", cred.getClientSecret(),
                    "status", cred.getStatus(),
                    "createdAt", cred.getCreatedAt(),
                    "warning", "Make sure to copy your client secret now. You won't be able to see it again!"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/credentials/rotate")
    public ResponseEntity<?> rotateCredentials(HttpServletRequest request, @PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        validateCredentialManagementPermission(role);

        try {
            ProductCredentialService.CredentialGeneratedResponse cred =
                    credentialService.rotateCredentials(tenantId, productId, email != null ? email : "system");

            return ResponseEntity.ok(Map.of(
                    "id", cred.getId(),
                    "clientId", cred.getClientId(),
                    "clientSecret", cred.getClientSecret(),
                    "status", cred.getStatus(),
                    "createdAt", cred.getCreatedAt(),
                    "warning", "Old credentials have been revoked. Store your new client secret safely!"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/credentials/revoke")
    public ResponseEntity<?> revokeCredentials(HttpServletRequest request, @PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        validateCredentialManagementPermission(role);

        try {
            credentialService.revokeCredentials(tenantId, productId, email != null ? email : "system");
            return ResponseEntity.ok(Map.of(
                    "status", "REVOKED",
                    "message", "Credentials revoked successfully. Product API access is now disabled."
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/audit-logs")
    public ResponseEntity<?> getAuditLogs(@PathVariable("id") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            List<ProductAuditLog> logs = productService.listAuditLogs(tenantId, productId);
            List<Map<String, Object>> response = logs.stream()
                    .map(l -> Map.<String, Object>of(
                            "id", l.getId(),
                            "action", l.getAction().name(),
                            "performedBy", l.getPerformedBy() != null ? l.getPerformedBy() : "system",
                            "details", l.getDetails() != null ? l.getDetails() : "",
                            "createdAt", l.getCreatedAt()
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private void validateCredentialManagementPermission(String userRoleStr) {
        if (userRoleStr == null) {
            throw new IllegalStateException("User role context is required");
        }
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can manage product credentials");
        }
    }

    private Map<String, Object> mapProductToResponse(Product product) {
        return Map.of(
                "id", product.getId(),
                "tenantId", product.getTenant().getId(),
                "name", product.getName(),
                "description", product.getDescription() != null ? product.getDescription() : "",
                "websiteUrl", product.getWebsiteUrl() != null ? product.getWebsiteUrl() : "",
                "status", product.getStatus().name(),
                "createdAt", product.getCreatedAt(),
                "updatedAt", product.getUpdatedAt()
        );
    }

    public static class CreateProductRequest {
        private String name;
        private String description;
        private String websiteUrl;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getWebsiteUrl() { return websiteUrl; }
        public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    }

    public static class UpdateProductRequest {
        private String name;
        private String description;
        private String websiteUrl;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getWebsiteUrl() { return websiteUrl; }
        public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    }

    public static class StatusUpdateRequest {
        private String status;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
