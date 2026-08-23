package com.subsflow.analytics;

import com.subsflow.analytics.service.AnalyticsService;
import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.entity.PaymentStatus;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.events.repository.CustomerUsageEventRepository;
import com.subsflow.plan.entity.BillingInterval;
import com.subsflow.plan.entity.PlanStatus;
import com.subsflow.plan.entity.ProductPlan;
import com.subsflow.plan.repository.ProductPlanRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerSubscriptionRepository subscriptionRepository;
    @Mock private ProductPlanRepository planRepository;
    @Mock private CustomerPaymentRepository paymentRepository;
    @Mock private CustomerUsageEventRepository usageRepository;
    @Mock private ProductRepository productRepository;

    private AnalyticsService analyticsService;
    private Tenant testTenant;
    private Product testProduct;
    private ProductPlan monthlyPlan;
    private ProductPlan yearlyPlan;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(
                customerRepository, subscriptionRepository, planRepository,
                paymentRepository, usageRepository, productRepository
        );

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);

        testProduct = new Product();
        testProduct.setId("prod_streaming");
        testProduct.setName("Netflix Streaming");
        testProduct.setTenant(testTenant);
        testProduct.setStatus(ProductStatus.ACTIVE);

        monthlyPlan = new ProductPlan();
        monthlyPlan.setId("plan_monthly");
        monthlyPlan.setName("Standard Monthly");
        monthlyPlan.setPrice(new BigDecimal("15.00"));
        monthlyPlan.setBillingInterval(BillingInterval.MONTHLY);
        monthlyPlan.setStatus(PlanStatus.ACTIVE);

        yearlyPlan = new ProductPlan();
        yearlyPlan.setId("plan_yearly");
        yearlyPlan.setName("Premium Yearly");
        yearlyPlan.setPrice(new BigDecimal("120.00"));
        yearlyPlan.setBillingInterval(BillingInterval.YEARLY);
        yearlyPlan.setStatus(PlanStatus.ACTIVE);
    }

    @Test
    @DisplayName("MRR and ARR calculate monthly-normalized subscription revenues accurately")
    void testMrrAndArrCalculation() {
        Customer c1 = new Customer();
        c1.setId("c1");
        c1.setName("Alice");
        c1.setEmail("alice@test.com");
        c1.setStatus(CustomerStatus.ACTIVE);

        CustomerSubscription sub1 = new CustomerSubscription();
        sub1.setId("s1");
        sub1.setCustomer(c1);
        sub1.setPlan(monthlyPlan);
        sub1.setPriceAtSubscription(new BigDecimal("15.00"));
        sub1.setBillingIntervalAtSubscription("MONTHLY");
        sub1.setStatus(CustomerSubscriptionStatus.ACTIVE);

        CustomerSubscription sub2 = new CustomerSubscription();
        sub2.setId("s2");
        sub2.setCustomer(c1);
        sub2.setPlan(yearlyPlan);
        sub2.setPriceAtSubscription(new BigDecimal("120.00")); // $120/yr -> $10/mo
        sub2.setBillingIntervalAtSubscription("YEARLY");
        sub2.setStatus(CustomerSubscriptionStatus.ACTIVE);

        CustomerSubscription cancelledSub = new CustomerSubscription();
        cancelledSub.setId("s3");
        cancelledSub.setCustomer(c1);
        cancelledSub.setPlan(monthlyPlan);
        cancelledSub.setPriceAtSubscription(new BigDecimal("50.00"));
        cancelledSub.setBillingIntervalAtSubscription("MONTHLY");
        cancelledSub.setStatus(CustomerSubscriptionStatus.CANCELLED); // Should not be in MRR

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(c1));
        when(subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(sub1, sub2, cancelledSub));
        when(paymentRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of());

        Map<String, Object> metrics = analyticsService.getOverviewMetrics("t_netflix", "prod_streaming");

        assertNotNull(metrics);
        // MRR = $15 (monthly) + $10 (yearly normalized) = $25.00
        assertEquals(new BigDecimal("25.00"), metrics.get("mrr"));
        // ARR = $25 * 12 = $300.00
        assertEquals(new BigDecimal("300.00"), metrics.get("arr"));
        assertEquals(2L, metrics.get("activeSubscriptions"));
        assertEquals(1L, metrics.get("cancelledSubscriptions"));
    }

    @Test
    @DisplayName("Churn rate and payment success rates compute correctly")
    void testChurnAndPaymentRates() {
        Customer c1 = new Customer();
        c1.setId("c1");
        c1.setStatus(CustomerStatus.ACTIVE);

        CustomerSubscription activeSub = new CustomerSubscription();
        activeSub.setId("s1");
        activeSub.setCustomer(c1);
        activeSub.setPlan(monthlyPlan);
        activeSub.setPriceAtSubscription(new BigDecimal("10.00"));
        activeSub.setBillingIntervalAtSubscription("MONTHLY");
        activeSub.setStatus(CustomerSubscriptionStatus.ACTIVE);

        CustomerSubscription cancelledSub = new CustomerSubscription();
        cancelledSub.setId("s2");
        cancelledSub.setCustomer(c1);
        cancelledSub.setPlan(monthlyPlan);
        cancelledSub.setPriceAtSubscription(new BigDecimal("10.00"));
        cancelledSub.setBillingIntervalAtSubscription("MONTHLY");
        cancelledSub.setStatus(CustomerSubscriptionStatus.CANCELLED);

        CustomerPayment pay1 = new CustomerPayment();
        pay1.setStatus(PaymentStatus.SUCCEEDED);
        pay1.setAmount(new BigDecimal("10.00"));
        pay1.setRefundedAmount(BigDecimal.ZERO);

        CustomerPayment pay2 = new CustomerPayment();
        pay2.setStatus(PaymentStatus.FAILED);
        pay2.setAmount(new BigDecimal("10.00"));
        pay2.setFailureCode("CARD_DECLINED");

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(c1));
        when(subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(activeSub, cancelledSub));
        when(paymentRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(pay1, pay2));

        Map<String, Object> metrics = analyticsService.getOverviewMetrics("t_netflix", "prod_streaming");

        // Churn = 1 cancelled / (1 active + 1 cancelled) = 50.0%
        assertEquals(50.0, metrics.get("churnRate"));
        // Payment success rate = 1 / 2 = 50.0%
        assertEquals(50.0, metrics.get("paymentSuccessRate"));
        assertEquals(1L, metrics.get("failedPayments"));
        assertEquals(new BigDecimal("10.00"), metrics.get("netRevenue"));
    }

    @Test
    @DisplayName("CSV export produces correct comma-separated headers and data")
    void testCsvExport() {
        Customer c1 = new Customer();
        c1.setId("cust_123");
        c1.setName("John Doe");
        c1.setEmail("john@netflix.com");
        c1.setStatus(CustomerStatus.ACTIVE);
        c1.setCreatedAt(OffsetDateTime.now());

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findAllByProductIdOrderByCreatedAtDesc("prod_streaming"))
                .thenReturn(List.of(c1));

        String csv = analyticsService.exportCustomersCsv("t_netflix", "prod_streaming");

        assertNotNull(csv);
        assertTrue(csv.startsWith("Customer ID,Name,Email,Status,Created At\n"));
        assertTrue(csv.contains("cust_123,John Doe,john@netflix.com,ACTIVE"));
    }

    @Test
    @DisplayName("Tenant isolation rejects cross-tenant metrics access")
    void testTenantIsolation() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_another"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            analyticsService.getOverviewMetrics("t_another", "prod_streaming");
        });
    }
}
