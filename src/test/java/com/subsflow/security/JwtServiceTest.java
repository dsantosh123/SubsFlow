package com.subsflow.security;

import com.subsflow.common.security.JwtService;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class JwtServiceTest {

    private JwtService jwtService;
    private static final String TEST_SECRET = "subsflow-super-secure-jwt-signing-secret-key-32bytes-minimum-length!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, 3600000); // 1 hour
    }

    @Test
    void testGenerateAndValidateJwtToken() {
        Tenant tenant = new Tenant();
        tenant.setId("t_test_123");
        tenant.setName("Acme Testing Corp");
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setApiKey("sk_test_api_key_abc");

        String token = jwtService.generateToken(tenant);
        assertThat(token).isNotBlank();

        // Validate
        boolean isValid = jwtService.isTokenValid(token);
        assertThat(isValid).isTrue();

        // Extract tenant ID
        String extractedTenantId = jwtService.extractTenantId(token);
        assertThat(extractedTenantId).isEqualTo("t_test_123");
    }

    @Test
    void testInvalidTokenReturnsFalse() {
        boolean isValid = jwtService.isTokenValid("invalid.jwt.token.string");
        assertThat(isValid).isFalse();
    }
}
