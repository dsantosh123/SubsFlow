package com.subsflow.product.service;

import com.subsflow.product.entity.*;
import com.subsflow.product.repository.ProductAuditLogRepository;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantRole;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductAuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;

    public ProductService(ProductRepository productRepository,
                          ProductAuditLogRepository auditLogRepository,
                          TenantRepository tenantRepository) {
        this.productRepository = productRepository;
        this.auditLogRepository = auditLogRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public Product createProduct(String tenantId, String userRoleStr, String actorEmail, String name, String description, String websiteUrl) {
        validateWritePermission(userRoleStr);

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        Product product = new Product();
        product.setId("prod_" + UUID.randomUUID().toString().substring(0, 8));
        product.setTenant(tenant);
        product.setName(name.trim());
        product.setDescription(description != null ? description.trim() : null);
        product.setWebsiteUrl(websiteUrl != null ? websiteUrl.trim() : null);
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        // Audit log
        ProductAuditLog audit = new ProductAuditLog();
        audit.setId("pal_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setProduct(product);
        audit.setTenant(tenant);
        audit.setAction(ProductAuditAction.PRODUCT_CREATED);
        audit.setPerformedBy(actorEmail);
        audit.setDetails("Product created: " + product.getName());
        auditLogRepository.save(audit);

        return product;
    }

    @Transactional(readOnly = true)
    public List<Product> listProducts(String tenantId) {
        return productRepository.findAllByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Product getProduct(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }

    @Transactional
    public Product updateProduct(String tenantId, String userRoleStr, String actorEmail, String productId, String name, String description, String websiteUrl) {
        validateWritePermission(userRoleStr);

        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        if (name != null && !name.trim().isEmpty()) {
            product.setName(name.trim());
        }
        if (description != null) {
            product.setDescription(description.trim());
        }
        if (websiteUrl != null) {
            product.setWebsiteUrl(websiteUrl.trim());
        }

        product = productRepository.save(product);

        // Audit log
        ProductAuditLog audit = new ProductAuditLog();
        audit.setId("pal_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setProduct(product);
        audit.setTenant(product.getTenant());
        audit.setAction(ProductAuditAction.PRODUCT_UPDATED);
        audit.setPerformedBy(actorEmail);
        audit.setDetails("Product updated: " + product.getName());
        auditLogRepository.save(audit);

        return product;
    }

    @Transactional
    public Product setProductStatus(String tenantId, String userRoleStr, String actorEmail, String productId, ProductStatus newStatus) {
        validateWritePermission(userRoleStr);

        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        product.setStatus(newStatus);
        product = productRepository.save(product);

        // Audit log
        ProductAuditLog audit = new ProductAuditLog();
        audit.setId("pal_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setProduct(product);
        audit.setTenant(product.getTenant());
        audit.setAction(newStatus == ProductStatus.ACTIVE ? ProductAuditAction.PRODUCT_ACTIVATED : ProductAuditAction.PRODUCT_DEACTIVATED);
        audit.setPerformedBy(actorEmail);
        audit.setDetails("Product status changed to: " + newStatus.name());
        auditLogRepository.save(audit);

        return product;
    }

    @Transactional(readOnly = true)
    public List<ProductAuditLog> listAuditLogs(String tenantId, String productId) {
        // Verify product belongs to tenant
        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        return auditLogRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) {
            throw new IllegalStateException("User role context is required");
        }
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can perform this action");
        }
    }
}
