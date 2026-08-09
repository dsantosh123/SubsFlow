package com.subsflow.subscription;

import com.subsflow.common.context.TenantContext;
import com.subsflow.subscription.entity.BillingPeriod;
import com.subsflow.subscription.entity.BillingPlan;
import com.subsflow.subscription.entity.BillingType;
import com.subsflow.subscription.entity.Subscription;
import com.subsflow.subscription.entity.SubscriptionStatus;
import com.subsflow.subscription.repository.BillingPlanRepository;
import com.subsflow.subscription.repository.SubscriptionRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@Testcontainers
class SubscriptionOptimisticLockingTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private BillingPlanRepository billingPlanRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        subscriptionRepository.deleteAll();
        billingPlanRepository.deleteAll();
        tenantRepository.deleteAll();

        tenant = new Tenant();
        tenant.setId("tenant-opt");
        tenant.setName("Opt Tenant");
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setApiKey("key-opt");
        tenantRepository.save(tenant);
    }

    @Test
    void concurrentUpdatesToSameSubscriptionShouldFailOptimistically() {
        TenantContext.setTenantId(tenant.getId());
        try {
            BillingPlan planA = new BillingPlan();
            planA.setId("plan-a");
            planA.setName("Plan A");
            planA.setBillingType(BillingType.FIXED);
            planA.setPrice(new BigDecimal("10.00"));
            planA.setBillingPeriod(BillingPeriod.MONTHLY);
            billingPlanRepository.save(planA);

            BillingPlan planB = new BillingPlan();
            planB.setId("plan-b");
            planB.setName("Plan B");
            planB.setBillingType(BillingType.FIXED);
            planB.setPrice(new BigDecimal("20.00"));
            planB.setBillingPeriod(BillingPeriod.MONTHLY);
            billingPlanRepository.save(planB);

            Subscription subscription = new Subscription();
            subscription.setId("sub-1");
            subscription.setPlan(planA);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setCurrentPeriodStart(OffsetDateTime.now().minusDays(10));
            subscription.setCurrentPeriodEnd(OffsetDateTime.now().plusDays(20));
            subscriptionRepository.save(subscription);

            Subscription stale = subscriptionRepository.findById("sub-1").orElseThrow();
            Subscription fresh = subscriptionRepository.findById("sub-1").orElseThrow();
            stale.setPlan(planA);
            stale.setStatus(SubscriptionStatus.PAST_DUE);
            subscriptionRepository.saveAndFlush(stale);

            fresh.setPlan(planB);
            fresh.setStatus(SubscriptionStatus.ACTIVE);

            assertThatThrownBy(() -> subscriptionRepository.saveAndFlush(fresh))
                    .isInstanceOf(ObjectOptimisticLockingFailureException.class);
        } finally {
            TenantContext.clear();
        }
    }
}
