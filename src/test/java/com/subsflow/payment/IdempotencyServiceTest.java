package com.subsflow.payment;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.exception.IdempotencyConflictException;
import com.subsflow.common.exception.IdempotencyKeyUsedException;
import com.subsflow.payment.repository.IdempotencyKeyRepository;
import com.subsflow.payment.service.IdempotencyService;
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

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
@Testcontainers
public class IdempotencyServiceTest {

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
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Autowired
    private IdempotencyService idempotencyService;

    private Tenant tenantA;
    private Tenant tenantB;

    @BeforeEach
    void setUp() {
        idempotencyKeyRepository.deleteAll();
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
    void testIdempotencyLifecycle() {
        // 1. Tenant A starts operation
        TenantContext.setTenantId(tenantA.getId());
        idempotencyService.startOperation("req-key-1", "hash-value-1");

        // 2. Parallel/duplicate request with same key & hash should throw conflict (in progress)
        assertThatThrownBy(() -> idempotencyService.startOperation("req-key-1", "hash-value-1"))
                .isInstanceOf(IdempotencyConflictException.class)
                .hasMessageContaining("Operation is already in progress");

        // 3. Complete the operation
        idempotencyService.completeOperation("req-key-1", "{\"status\":\"success\",\"amount\":99.99}");

        // 4. Repeated request should throw IdempotencyKeyUsedException containing the cached payload
        assertThatThrownBy(() -> idempotencyService.startOperation("req-key-1", "hash-value-1"))
                .isInstanceOf(IdempotencyKeyUsedException.class)
                .satisfies(ex -> {
                    IdempotencyKeyUsedException usedEx = (IdempotencyKeyUsedException) ex;
                    assertThat(usedEx.getResponsePayload()).isEqualTo("{\"status\":\"success\",\"amount\":99.99}");
                });

        // 5. Querying with a different request hash (key reuse misuse) should throw conflict
        assertThatThrownBy(() -> idempotencyService.startOperation("req-key-1", "hash-different"))
                .isInstanceOf(IdempotencyConflictException.class)
                .hasMessageContaining("used with a different request payload");

        TenantContext.clear();

        // 6. Tenant B uses the same key -> should succeed (tenant isolated!)
        TenantContext.setTenantId(tenantB.getId());
        idempotencyService.startOperation("req-key-1", "hash-value-1"); // Should not clash with tenant A
        TenantContext.clear();
    }
}
