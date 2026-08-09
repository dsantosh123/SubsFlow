package com.subsflow.tenant;

import com.subsflow.common.context.TenantContext;
import com.subsflow.subscription.entity.BillingPeriod;
import com.subsflow.subscription.entity.BillingPlan;
import com.subsflow.subscription.entity.BillingType;
import com.subsflow.subscription.repository.BillingPlanRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@Testcontainers
public class TenantIsolationTest {

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

    private Tenant tenantA;
    private Tenant tenantB;

    @BeforeEach
    void setUp() {
        // Clear database tables (order is important due to constraints)
        billingPlanRepository.deleteAll();
        tenantRepository.deleteAll();

        // Create Tenant A
        tenantA = new Tenant();
        tenantA.setId("tenant-a");
        tenantA.setName("Tenant A");
        tenantA.setStatus(TenantStatus.ACTIVE);
        tenantA.setApiKey("key-a");
        tenantRepository.save(tenantA);

        // Create Tenant B
        tenantB = new Tenant();
        tenantB.setId("tenant-b");
        tenantB.setName("Tenant B");
        tenantB.setStatus(TenantStatus.ACTIVE);
        tenantB.setApiKey("key-b");
        tenantRepository.save(tenantB);
    }

    @Test
    void testTenantIsolationWithJPA() {
        // 1. Create a billing plan under Tenant A
        TenantContext.setTenantId(tenantA.getId());
        BillingPlan planA = new BillingPlan();
        planA.setId("plan-a");
        planA.setName("Plan A (Tenant A)");
        planA.setBillingType(BillingType.FIXED);
        planA.setPrice(new BigDecimal("99.99"));
        planA.setBillingPeriod(BillingPeriod.MONTHLY);
        billingPlanRepository.save(planA);
        TenantContext.clear();

        // 2. Create a billing plan under Tenant B
        TenantContext.setTenantId(tenantB.getId());
        BillingPlan planB = new BillingPlan();
        planB.setId("plan-b");
        planB.setName("Plan B (Tenant B)");
        planB.setBillingType(BillingType.USAGE_BASED);
        planB.setPrice(new BigDecimal("0.05"));
        planB.setBillingPeriod(BillingPeriod.MONTHLY);
        billingPlanRepository.save(planB);
        TenantContext.clear();

        // 3. Under Tenant A Context: query plan. Assert only Plan A is visible.
        TenantContext.setTenantId(tenantA.getId());
        List<BillingPlan> plansA = billingPlanRepository.findAll();
        assertThat(plansA).hasSize(1);
        assertThat(plansA.get(0).getId()).isEqualTo("plan-a");
        TenantContext.clear();

        // 4. Under Tenant B Context: query plan. Assert only Plan B is visible.
        TenantContext.setTenantId(tenantB.getId());
        List<BillingPlan> plansB = billingPlanRepository.findAll();
        assertThat(plansB).hasSize(1);
        assertThat(plansB.get(0).getId()).isEqualTo("plan-b");
        TenantContext.clear();
    }
}
