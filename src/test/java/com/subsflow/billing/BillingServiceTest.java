package com.subsflow.billing;

import com.subsflow.billing.entity.*;
import com.subsflow.billing.provider.PaymentProviderRegistry;
import com.subsflow.billing.provider.SandboxPaymentProvider;
import com.subsflow.billing.repository.*;
import com.subsflow.billing.service.BillingService;
import com.subsflow.customer.entity.*;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.customer.repository.SubscriptionHistoryRepository;
import com.subsflow.plan.entity.BillingInterval;
import com.subsflow.plan.entity.PlanStatus;
import com.subsflow.plan.entity.PlanVisibility;
import com.subsflow.plan.entity.ProductPlan;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock private CustomerInvoiceRepository invoiceRepository;
    @Mock private CustomerPaymentRepository paymentRepository;
    @Mock private PaymentRefundRepository refundRepository;
    @Mock private BillingAccountRepository billingAccountRepository;
    @Mock private PaymentMethodReferenceRepository paymentMethodRepository;
    @Mock private CustomerSubscriptionRepository subscriptionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;
    @Mock private SubscriptionHistoryRepository historyRepository;

    private BillingService billingService;
    private Tenant testTenant;
    private Product testProduct;
    private Customer testCustomer;
    private ProductPlan testPlan;
    private CustomerSubscription testSub;
    private CustomerInvoice testInvoice;

    @BeforeEach
    void setUp() {
        PaymentProviderRegistry registry = new PaymentProviderRegistry(List.of(new SandboxPaymentProvider()));
        billingService = new BillingService(
                invoiceRepository, paymentRepository, refundRepository, billingAccountRepository,
                paymentMethodRepository, subscriptionRepository, customerRepository, productRepository,
                historyRepository, registry
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

        testPlan = new ProductPlan();
        testPlan.setId("plan_prem");
        testPlan.setName("Premium");
        testPlan.setPrice(new BigDecimal("25.00"));
        testPlan.setCurrency("USD");
        testPlan.setBillingInterval(BillingInterval.MONTHLY);
        testPlan.setStatus(PlanStatus.ACTIVE);
        testPlan.setVisibility(PlanVisibility.PUBLIC);

        testSub = new CustomerSubscription();
        testSub.setId("sub_123");
        testSub.setTenant(testTenant);
        testSub.setProduct(testProduct);
        testSub.setCustomer(testCustomer);
        testSub.setPlan(testPlan);
        testSub.setPriceAtSubscription(new BigDecimal("25.00"));
        testSub.setCurrencyAtSubscription("USD");
        testSub.setBillingIntervalAtSubscription("MONTHLY");
        testSub.setStatus(CustomerSubscriptionStatus.TRIALING);
        testSub.setCurrentPeriodStart(OffsetDateTime.now());
        testSub.setCurrentPeriodEnd(OffsetDateTime.now().plusMonths(1));

        testInvoice = new CustomerInvoice();
        testInvoice.setId("inv_123");
        testInvoice.setTenant(testTenant);
        testInvoice.setProduct(testProduct);
        testInvoice.setCustomer(testCustomer);
        testInvoice.setSubscription(testSub);
        testInvoice.setInvoiceNumber("INV-2026-001");
        testInvoice.setStatus(InvoiceStatus.OPEN);
        testInvoice.setSubtotal(new BigDecimal("25.00"));
        testInvoice.setTotal(new BigDecimal("25.00"));
        testInvoice.setCurrency("USD");
        testInvoice.setBillingPeriodStart(testSub.getCurrentPeriodStart());
        testInvoice.setBillingPeriodEnd(testSub.getCurrentPeriodEnd());
        testInvoice.setDueDate(OffsetDateTime.now().plusDays(7));
    }

    @Test
    @DisplayName("Successful payment transitions invoice to PAID and activates subscription")
    void testSuccessfulPayment() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(subscriptionRepository.findByIdAndProductId("sub_123", "prod_streaming"))
                .thenReturn(Optional.of(testSub));
        when(invoiceRepository.findByIdAndProductId("inv_123", "prod_streaming"))
                .thenReturn(Optional.of(testInvoice));
        when(paymentRepository.save(any(CustomerPayment.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerPayment payment = billingService.executePayment(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_john",
                "sub_123", "inv_123", "pm_card_visa", "SANDBOX"
        );

        assertNotNull(payment);
        assertEquals(PaymentStatus.SUCCEEDED, payment.getStatus());
        assertEquals(InvoiceStatus.PAID, testInvoice.getStatus());
        assertEquals(CustomerSubscriptionStatus.ACTIVE, testSub.getStatus());
        assertNotNull(payment.getPaidAt());
        assertNotNull(testInvoice.getPaidAt());

        verify(invoiceRepository, times(1)).save(testInvoice);
        verify(subscriptionRepository, times(1)).save(testSub);
        verify(historyRepository, times(1)).save(any(SubscriptionHistory.class));
    }

    @Test
    @DisplayName("Failed payment records failure info, leaves invoice OPEN, and does not activate subscription")
    void testFailedPayment() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_john", "prod_streaming"))
                .thenReturn(Optional.of(testCustomer));
        when(subscriptionRepository.findByIdAndProductId("sub_123", "prod_streaming"))
                .thenReturn(Optional.of(testSub));
        when(invoiceRepository.findByIdAndProductId("inv_123", "prod_streaming"))
                .thenReturn(Optional.of(testInvoice));
        when(paymentRepository.save(any(CustomerPayment.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerPayment payment = billingService.executePayment(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_john",
                "sub_123", "inv_123", "pm_card_decline", "SANDBOX"
        );

        assertNotNull(payment);
        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        assertEquals("CARD_DECLINED", payment.getFailureCode());
        assertEquals(InvoiceStatus.OPEN, testInvoice.getStatus());
        assertEquals(CustomerSubscriptionStatus.TRIALING, testSub.getStatus()); // unchanged

        verify(invoiceRepository, never()).save(testInvoice);
    }

    @Test
    @DisplayName("Partial and Full Refunds calculate remaining balances correctly")
    void testPartialAndFullRefunds() {
        CustomerPayment payment = new CustomerPayment();
        payment.setId("pay_999");
        payment.setTenant(testTenant);
        payment.setProduct(testProduct);
        payment.setCustomer(testCustomer);
        payment.setSubscription(testSub);
        payment.setAmount(new BigDecimal("25.00"));
        payment.setRefundedAmount(BigDecimal.ZERO);
        payment.setCurrency("USD");
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setProvider("SANDBOX");
        payment.setProviderPaymentId("ch_sandbox_999");

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(paymentRepository.findByIdAndProductId("pay_999", "prod_streaming"))
                .thenReturn(Optional.of(payment));
        when(refundRepository.save(any(PaymentRefund.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Partial refund of $10
        PaymentRefund partialRefund = billingService.refundPayment(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "pay_999",
                new BigDecimal("10.00"), "Customer requested discount"
        );

        assertNotNull(partialRefund);
        assertEquals(PaymentStatus.PARTIALLY_REFUNDED, payment.getStatus());
        assertEquals(new BigDecimal("10.00"), payment.getRefundedAmount());

        // 2. Full refund of remaining $15
        PaymentRefund fullRefund = billingService.refundPayment(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "pay_999",
                new BigDecimal("15.00"), "Full cancellation"
        );

        assertNotNull(fullRefund);
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(new BigDecimal("25.00"), payment.getRefundedAmount());
    }

    @Test
    @DisplayName("Refund exceeding available balance is rejected")
    void testRefundExceedingBalanceRejected() {
        CustomerPayment payment = new CustomerPayment();
        payment.setId("pay_999");
        payment.setTenant(testTenant);
        payment.setProduct(testProduct);
        payment.setAmount(new BigDecimal("25.00"));
        payment.setRefundedAmount(new BigDecimal("20.00")); // only $5 remaining
        payment.setCurrency("USD");
        payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(paymentRepository.findByIdAndProductId("pay_999", "prod_streaming"))
                .thenReturn(Optional.of(payment));

        assertThrows(IllegalArgumentException.class, () -> {
            billingService.refundPayment(
                    "t_netflix", "ADMIN", "admin@netflix.com", "prod_streaming", "pay_999",
                    new BigDecimal("10.00"), "Excess refund"
            );
        });
    }

    @Test
    @DisplayName("DEVELOPER cannot process refunds or execute payments")
    void testDeveloperPermissionDenied() {
        assertThrows(IllegalStateException.class, () -> {
            billingService.refundPayment(
                    "t_netflix", "DEVELOPER", "dev@netflix.com", "prod_streaming", "pay_1",
                    new BigDecimal("5.00"), "Dev refund"
            );
        });
    }
}
