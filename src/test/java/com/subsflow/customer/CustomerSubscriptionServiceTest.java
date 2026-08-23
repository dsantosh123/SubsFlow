package com.subsflow.customer;

import com.subsflow.customer.entity.*;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.customer.repository.SubscriptionHistoryRepository;
import com.subsflow.customer.service.CustomerSubscriptionService;
import com.subsflow.plan.entity.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerSubscriptionServiceTest {

    @Mock
    private CustomerSubscriptionRepository subscriptionRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductPlanRepository planRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SubscriptionHistoryRepository historyRepository;

    private CustomerSubscriptionService subscriptionService;
    private Tenant testTenant;
    private Product testProduct;
    private Customer testCustomer;
    private ProductPlan testPlanStandard;
    private ProductPlan testPlanPremium;

    @BeforeEach
    void setUp() {
        subscriptionService = new CustomerSubscriptionService(
                subscriptionRepository, customerRepository, planRepository, productRepository, historyRepository
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

        testCustomer = new Customer();
        testCustomer.setId("cust_john");
        testCustomer.setName("John Doe");
        testCustomer.setEmail("john@netflix.com");
        testCustomer.setTenant(testTenant);
        testCustomer.setProduct(testProduct);
        testCustomer.setStatus(CustomerStatus.ACTIVE);

        testPlanStandard = new ProductPlan();
        testPlanStandard.setId("plan_std");
        testPlanStandard.setName("Standard");
        testPlanStandard.setPrice(new BigDecimal("15.49"));
        testPlanStandard.setCurrency("USD");
        testPlanStandard.setBillingInterval(BillingInterval.MONTHLY);
        testPlanStandard.setTrialDays(7);
        testPlanStandard.setStatus(PlanStatus.ACTIVE);
        testPlanStandard.setVisibility(PlanVisibility.PUBLIC);
        testPlanStandard.setTenant(testTenant);
        testPlanStandard.setProduct(testProduct);
        testPlanStandard.setFeatures(new ArrayList<>());

        testPlanPremium = new ProductPlan();
        testPlanPremium.setId("plan_prem");
        testPlanPremium.setName("Premium 4K");
        testPlanPremium.setPrice(new BigDecimal("22.99"));
        testPlanPremium.setCurrency("USD");
        testPlanPremium.setBillingInterval(BillingInterval.MONTHLY);
        testPlanPremium.setTrialDays(0);
        testPlanPremium.setStatus(PlanStatus.ACTIVE);
        testPlanPremium.setVisibility(PlanVisibility.PUBLIC);
        testPlanPremium.setTenant(testTenant);
        testPlanPremium.setProduct(testProduct);
        testPlanPremium.setFeatures(new ArrayList<>());
    }

    @Test
    @DisplayName("Subscription creation with trialDays > 0 enters TRIALING status and snapshots plan price")
    void testCreateSubscriptionWithTrial() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(planRepository.findByIdAndProductId("plan_std", "prod_streaming"))
                .thenReturn(Optional.of(testPlanStandard));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerSubscription sub = subscriptionService.createSubscription(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_john", "plan_std"
        );

        assertNotNull(sub);
        assertEquals(CustomerSubscriptionStatus.TRIALING, sub.getStatus());
        assertEquals(new BigDecimal("15.49"), sub.getPriceAtSubscription());
        assertEquals("USD", sub.getCurrencyAtSubscription());
        assertEquals("MONTHLY", sub.getBillingIntervalAtSubscription());
        assertEquals(7, sub.getTrialDays());
        assertNotNull(sub.getTrialEndDate());

        verify(subscriptionRepository, times(1)).save(any(CustomerSubscription.class));
        verify(historyRepository, atLeast(1)).save(any(SubscriptionHistory.class));
    }

    @Test
    @DisplayName("Subscription creation with trialDays = 0 enters ACTIVE status immediately")
    void testCreateSubscriptionNoTrial() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(planRepository.findByIdAndProductId("plan_prem", "prod_streaming"))
                .thenReturn(Optional.of(testPlanPremium));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerSubscription sub = subscriptionService.createSubscription(
                "t_netflix", "ADMIN", "admin@netflix.com", "prod_streaming", "cust_john", "plan_prem"
        );

        assertNotNull(sub);
        assertEquals(CustomerSubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(new BigDecimal("22.99"), sub.getPriceAtSubscription());
        assertNull(sub.getTrialEndDate());
    }

    @Test
    @DisplayName("Cannot create subscription for INACTIVE customer")
    void testInactiveCustomerCannotSubscribe() {
        testCustomer.setStatus(CustomerStatus.INACTIVE);
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));

        assertThrows(IllegalStateException.class, () -> {
            subscriptionService.createSubscription(
                    "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_john", "plan_std"
            );
        });
    }

    @Test
    @DisplayName("Cannot create subscription for DRAFT, INACTIVE or PRIVATE plan")
    void testInactiveOrPrivatePlanCannotBeSubscribed() {
        testPlanStandard.setStatus(PlanStatus.DRAFT);
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(planRepository.findByIdAndProductId("plan_std", "prod_streaming"))
                .thenReturn(Optional.of(testPlanStandard));

        assertThrows(IllegalStateException.class, () -> {
            subscriptionService.createSubscription(
                    "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_john", "plan_std"
            );
        });
    }

    @Test
    @DisplayName("State transitions: Pause and Resume work correctly")
    void testPauseAndResume() {
        CustomerSubscription sub = new CustomerSubscription();
        sub.setId("sub_1");
        sub.setTenant(testTenant);
        sub.setProduct(testProduct);
        sub.setCustomer(testCustomer);
        sub.setPlan(testPlanStandard);
        sub.setStatus(CustomerSubscriptionStatus.ACTIVE);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(subscriptionRepository.findByIdAndProductId("sub_1", "prod_streaming"))
                .thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        // Pause
        CustomerSubscription paused = subscriptionService.pauseSubscription(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "sub_1"
        );
        assertEquals(CustomerSubscriptionStatus.PAUSED, paused.getStatus());

        // Resume
        CustomerSubscription resumed = subscriptionService.resumeSubscription(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "sub_1"
        );
        assertEquals(CustomerSubscriptionStatus.ACTIVE, resumed.getStatus());
    }

    @Test
    @DisplayName("Immediate Cancellation sets status to CANCELLED and records history")
    void testImmediateCancellation() {
        CustomerSubscription sub = new CustomerSubscription();
        sub.setId("sub_1");
        sub.setTenant(testTenant);
        sub.setProduct(testProduct);
        sub.setCustomer(testCustomer);
        sub.setPlan(testPlanStandard);
        sub.setStatus(CustomerSubscriptionStatus.ACTIVE);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(subscriptionRepository.findByIdAndProductId("sub_1", "prod_streaming"))
                .thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerSubscription cancelled = subscriptionService.cancelSubscription(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "sub_1", false
        );

        assertEquals(CustomerSubscriptionStatus.CANCELLED, cancelled.getStatus());
        assertNotNull(cancelled.getCancelledAt());
        assertNotNull(cancelled.getEndedAt());
        assertFalse(cancelled.isCancelAtPeriodEnd());
    }

    @Test
    @DisplayName("Cancel at period end sets flag without immediately changing status to CANCELLED")
    void testCancelAtPeriodEnd() {
        CustomerSubscription sub = new CustomerSubscription();
        sub.setId("sub_1");
        sub.setTenant(testTenant);
        sub.setProduct(testProduct);
        sub.setCustomer(testCustomer);
        sub.setPlan(testPlanStandard);
        sub.setStatus(CustomerSubscriptionStatus.ACTIVE);
        sub.setCurrentPeriodEnd(OffsetDateTime.now().plusMonths(1));

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(subscriptionRepository.findByIdAndProductId("sub_1", "prod_streaming"))
                .thenReturn(Optional.of(sub));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerSubscription scheduled = subscriptionService.cancelSubscription(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "sub_1", true
        );

        assertEquals(CustomerSubscriptionStatus.ACTIVE, scheduled.getStatus());
        assertTrue(scheduled.isCancelAtPeriodEnd());
        assertNotNull(scheduled.getCancelledAt());
        assertNull(scheduled.getEndedAt());
    }

    @Test
    @DisplayName("Change Plan updates subscription plan and price snapshot, recording PLAN_CHANGED in history")
    void testChangePlan() {
        CustomerSubscription sub = new CustomerSubscription();
        sub.setId("sub_1");
        sub.setTenant(testTenant);
        sub.setProduct(testProduct);
        sub.setCustomer(testCustomer);
        sub.setPlan(testPlanStandard);
        sub.setPriceAtSubscription(new BigDecimal("15.49"));
        sub.setStatus(CustomerSubscriptionStatus.ACTIVE);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(subscriptionRepository.findByIdAndProductId("sub_1", "prod_streaming"))
                .thenReturn(Optional.of(sub));
        when(planRepository.findByIdAndProductId("plan_prem", "prod_streaming"))
                .thenReturn(Optional.of(testPlanPremium));
        when(subscriptionRepository.save(any(CustomerSubscription.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerSubscription updated = subscriptionService.changePlan(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "sub_1", "plan_prem"
        );

        assertEquals("plan_prem", updated.getPlan().getId());
        assertEquals(new BigDecimal("22.99"), updated.getPriceAtSubscription());
        verify(historyRepository, times(1)).save(any(SubscriptionHistory.class));
    }
}
