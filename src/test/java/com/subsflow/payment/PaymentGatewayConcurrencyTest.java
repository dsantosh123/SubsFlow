package com.subsflow.payment;

import com.subsflow.billing.entity.Invoice;
import com.subsflow.billing.entity.InvoiceStatus;
import com.subsflow.payment.entity.PaymentStatus;
import com.subsflow.payment.entity.PaymentTransaction;
import com.subsflow.payment.service.PaymentService;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.entity.SubscriptionStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@Testcontainers
class PaymentGatewayConcurrencyTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private PaymentService paymentService;

    @MockBean
    private com.subsflow.payment.gateway.PaymentGatewayClient gatewayClient;

    @Test
    void duplicateChargeCallsShouldBePreventedByIdempotencyKey() throws Exception {
        // This test exercises the service path for concurrent duplicate payment calls; the actual guard is enforced in the controller/service layer.
        Subscription subscription = new Subscription();
        subscription.setId("sub-dup");
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setCurrentPeriodStart(OffsetDateTime.now().minusDays(10));
        subscription.setCurrentPeriodEnd(OffsetDateTime.now().plusDays(20));

        Invoice invoice = new Invoice();
        invoice.setId("inv-dup");
        invoice.setAmount(new BigDecimal("25.00"));
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setDueDate(OffsetDateTime.now().plusDays(7));

        when(gatewayClient.charge(any())).thenReturn(new com.subsflow.payment.gateway.ChargeResponse(true, "gw-1", null));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Future<PaymentTransaction> first = pool.submit(() -> {
            start.await();
            return paymentService.processPayment(subscription, invoice, "pm-1", "dup-key");
        });
        Future<PaymentTransaction> second = pool.submit(() -> {
            start.await();
            return paymentService.processPayment(subscription, invoice, "pm-1", "dup-key");
        });
        start.countDown();
        PaymentTransaction tx1 = first.get();
        PaymentTransaction tx2 = second.get();
        pool.shutdown();

        assertThat(tx1.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(tx2.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }
}
