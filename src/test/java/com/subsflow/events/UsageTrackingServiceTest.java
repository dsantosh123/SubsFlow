package com.subsflow.events;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.events.entity.CustomerUsageEvent;
import com.subsflow.events.repository.CustomerUsageEventRepository;
import com.subsflow.events.service.UsageTrackingService;
import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsageTrackingServiceTest {

    @Mock private CustomerUsageEventRepository usageRepository;
    @Mock private CustomerSubscriptionRepository subscriptionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;

    private UsageTrackingService usageService;
    private Tenant testTenant;
    private Product testProduct;
    private Customer testCustomer;
    private CustomerSubscription testSub;

    @BeforeEach
    void setUp() {
        usageService = new UsageTrackingService(usageRepository, subscriptionRepository, customerRepository, productRepository);

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);

        testProduct = new Product();
        testProduct.setId("prod_streaming");
        testProduct.setName("Netflix Streaming");
        testProduct.setTenant(testTenant);
        testProduct.setStatus(ProductStatus.ACTIVE);

        testCustomer = new Customer();
        testCustomer.setId("cust_john");
        testCustomer.setName("John Doe");
        testCustomer.setEmail("john@netflix.com");
        testCustomer.setTenant(testTenant);
        testCustomer.setProduct(testProduct);
        testCustomer.setStatus(CustomerStatus.ACTIVE);

        testSub = new CustomerSubscription();
        testSub.setId("sub_123");
        testSub.setTenant(testTenant);
        testSub.setProduct(testProduct);
        testSub.setCustomer(testCustomer);
        testSub.setStatus(CustomerSubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("Record usage succeeds on ACTIVE subscription")
    void testRecordUsageSuccess() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(subscriptionRepository.findByIdAndProductId("sub_123", "prod_streaming"))
                .thenReturn(Optional.of(testSub));
        when(usageRepository.save(any(CustomerUsageEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerUsageEvent event = usageService.recordUsage(
                "t_netflix", "DEVELOPER", "dev@netflix.com", "prod_streaming",
                "cust_john", "sub_123", "downloads", new BigDecimal("5.0"),
                "idem_001", OffsetDateTime.now(), "{\"quality\":\"4k\"}"
        );

        assertNotNull(event);
        assertEquals("downloads", event.getFeatureKey());
        assertEquals(new BigDecimal("5.0"), event.getQuantity());
        assertEquals("idem_001", event.getIdempotencyKey());

        verify(usageRepository, times(1)).save(any(CustomerUsageEvent.class));
    }

    @Test
    @DisplayName("Idempotent duplicate usage does not double count")
    void testIdempotentDuplicateUsage() {
        CustomerUsageEvent existing = new CustomerUsageEvent();
        existing.setId("use_existing");
        existing.setFeatureKey("downloads");
        existing.setQuantity(new BigDecimal("5.0"));
        existing.setIdempotencyKey("idem_duplicate");

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(subscriptionRepository.findByIdAndProductId("sub_123", "prod_streaming"))
                .thenReturn(Optional.of(testSub));
        when(usageRepository.existsByTenantIdAndIdempotencyKey("t_netflix", "idem_duplicate"))
                .thenReturn(true);
        when(usageRepository.findAllBySubscriptionIdOrderByOccurredAtDesc("sub_123"))
                .thenReturn(List.of(existing));

        CustomerUsageEvent event = usageService.recordUsage(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming",
                "cust_john", "sub_123", "downloads", new BigDecimal("5.0"),
                "idem_duplicate", OffsetDateTime.now(), null
        );

        assertEquals("use_existing", event.getId());
        verify(usageRepository, never()).save(any(CustomerUsageEvent.class));
    }

    @Test
    @DisplayName("Recording usage on CANCELLED subscription is rejected")
    void testUsageOnCancelledSubscriptionRejected() {
        testSub.setStatus(CustomerSubscriptionStatus.CANCELLED);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(subscriptionRepository.findByIdAndProductId("sub_123", "prod_streaming"))
                .thenReturn(Optional.of(testSub));

        assertThrows(IllegalStateException.class, () -> {
            usageService.recordUsage(
                    "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming",
                    "cust_john", "sub_123", "downloads", BigDecimal.ONE,
                    "idem_cancelled", OffsetDateTime.now(), null
            );
        });
    }

    @Test
    @DisplayName("Aggregated usage returns correct totals per feature")
    void testAggregatedUsage() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(usageRepository.sumQuantityByProductGroupByFeature("prod_streaming"))
                .thenReturn(List.of(
                        new Object[]{"screens", new BigDecimal("12.0000")},
                        new Object[]{"downloads", new BigDecimal("45.0000")}
                ));
        when(usageRepository.countByProductId("prod_streaming")).thenReturn(15L);

        Map<String, Object> summary = usageService.getAggregatedUsage("t_netflix", "prod_streaming");

        assertNotNull(summary);
        assertEquals(new BigDecimal("57.0000"), summary.get("totalQuantity"));
        assertEquals(15L, summary.get("totalEventsCount"));

        Map<String, BigDecimal> byFeature = (Map<String, BigDecimal>) summary.get("byFeature");
        assertEquals(new BigDecimal("12.0000"), byFeature.get("screens"));
        assertEquals(new BigDecimal("45.0000"), byFeature.get("downloads"));
    }
}
