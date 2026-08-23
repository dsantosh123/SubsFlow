package com.subsflow.admin;

import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.admin.repository.PlatformAdminRepository;
import com.subsflow.admin.service.AdminAuditService;
import com.subsflow.admin.service.AdminManagementService;
import com.subsflow.admin.service.AdminSearchService;
import com.subsflow.billing.repository.CustomerInvoiceRepository;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.product.repository.ProductRepository;
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
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminManagementTest {

    @Mock private PlatformAdminRepository adminRepository;
    @Mock private AdminAuditService auditService;
    @Mock private TenantRepository tenantRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerSubscriptionRepository subscriptionRepository;
    @Mock private CustomerPaymentRepository paymentRepository;
    @Mock private CustomerInvoiceRepository invoiceRepository;

    private AdminManagementService managementService;
    private AdminSearchService searchService;

    @BeforeEach
    void setUp() {
        managementService = new AdminManagementService(adminRepository, auditService);
        searchService = new AdminSearchService(
                tenantRepository, productRepository, customerRepository,
                subscriptionRepository, paymentRepository, invoiceRepository
        );
    }

    @Test
    @DisplayName("Create platform admin persists hashed password and logs audit action")
    void testCreateAdmin() {
        when(adminRepository.findByEmail("ops@subsflow.com")).thenReturn(Optional.empty());
        when(adminRepository.save(any(PlatformAdmin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlatformAdmin created = managementService.createAdmin(
                "Support Lead", "ops@subsflow.com", "SecurePassword123!", "PLATFORM_SUPPORT",
                "admin_dev_1", "admin@subsflow.com"
        );

        assertNotNull(created);
        assertEquals("ops@subsflow.com", created.getEmail());
        assertEquals("PLATFORM_SUPPORT", created.getRole());
        assertEquals("ACTIVE", created.getStatus());
        assertNotEquals("SecurePassword123!", created.getPasswordHash());

        verify(auditService).logAction(
                eq("admin_dev_1"),
                eq("admin@subsflow.com"),
                eq("CREATE_PLATFORM_ADMIN"),
                eq(created.getId()),
                contains("Created new internal admin user")
        );
    }

    @Test
    @DisplayName("Admin status toggle prevents self-deactivation and saves new status")
    void testAdminStatusToggle() {
        PlatformAdmin other = new PlatformAdmin();
        other.setId("admin_other");
        other.setEmail("other@subsflow.com");
        other.setStatus("ACTIVE");

        when(adminRepository.findById("admin_other")).thenReturn(Optional.of(other));
        when(adminRepository.save(any(PlatformAdmin.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlatformAdmin updated = managementService.updateStatus(
                "admin_other", "DISABLED", "admin_dev_1", "admin@subsflow.com"
        );

        assertEquals("DISABLED", updated.getStatus());

        // Self-disable must throw
        assertThrows(IllegalArgumentException.class, () -> {
            managementService.updateStatus("admin_dev_1", "DISABLED", "admin_dev_1", "admin@subsflow.com");
        });
    }

    @Test
    @DisplayName("Global search finds matching tenant records with query")
    void testGlobalSearch() {
        Tenant t = new Tenant();
        t.setId("t_spotify");
        t.setName("Spotify Inc");
        t.setStatus(TenantStatus.ACTIVE);
        t.setContactEmail("ops@spotify.com");

        when(tenantRepository.findAll()).thenReturn(List.of(t));
        when(productRepository.findAll()).thenReturn(List.of());
        when(customerRepository.findAll()).thenReturn(List.of());
        when(subscriptionRepository.findAll()).thenReturn(List.of());
        when(paymentRepository.findAll()).thenReturn(List.of());

        Map<String, Object> results = searchService.globalSearch("spotify");

        assertNotNull(results);
        List<?> tenants = (List<?>) results.get("tenants");
        assertEquals(1, tenants.size());
    }
}
