package com.subsflow.product;

import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductAuditLogRepository;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.product.service.ProductService;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductAuditLogRepository auditLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    private ProductService productService;
    private Tenant testTenant;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, auditLogRepository, tenantRepository);

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);
    }

    @Test
    @DisplayName("OWNER should be able to create a product")
    void testOwnerCanCreateProduct() {
        when(tenantRepository.findById("t_netflix")).thenReturn(Optional.of(testTenant));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product product = productService.createProduct(
                "t_netflix",
                "OWNER",
                "owner@netflix.com",
                "Netflix Streaming",
                "Video streaming platform",
                "https://netflix.com"
        );

        assertNotNull(product);
        assertEquals("Netflix Streaming", product.getName());
        assertEquals("t_netflix", product.getTenant().getId());
        assertEquals(ProductStatus.ACTIVE, product.getStatus());
        verify(productRepository, times(1)).save(any(Product.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("ADMIN should be able to create a product")
    void testAdminCanCreateProduct() {
        when(tenantRepository.findById("t_netflix")).thenReturn(Optional.of(testTenant));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product product = productService.createProduct(
                "t_netflix",
                "ADMIN",
                "admin@netflix.com",
                "Netflix Games",
                "Mobile gaming catalog",
                "https://games.netflix.com"
        );

        assertNotNull(product);
        assertEquals("Netflix Games", product.getName());
    }

    @Test
    @DisplayName("DEVELOPER should NOT be able to create a product")
    void testDeveloperCannotCreateProduct() {
        assertThrows(IllegalStateException.class, () -> {
            productService.createProduct(
                    "t_netflix",
                    "DEVELOPER",
                    "dev@netflix.com",
                    "Netflix Dev API",
                    null,
                    null
            );
        });
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant A cannot access Tenant B's product")
    void testTenantIsolationOnProductGet() {
        when(productRepository.findByIdAndTenantId("prod_123", "t_hulu")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            productService.getProduct("t_hulu", "prod_123");
        });
    }

    @Test
    @DisplayName("OWNER can deactivate and reactivate product")
    void testSetProductStatus() {
        Product existing = new Product();
        existing.setId("prod_123");
        existing.setName("Netflix Streaming");
        existing.setTenant(testTenant);
        existing.setStatus(ProductStatus.ACTIVE);

        when(productRepository.findByIdAndTenantId("prod_123", "t_netflix")).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product updated = productService.setProductStatus("t_netflix", "OWNER", "owner@netflix.com", "prod_123", ProductStatus.INACTIVE);

        assertEquals(ProductStatus.INACTIVE, updated.getStatus());
        verify(auditLogRepository, times(1)).save(any());
    }
}
