package com.subsflow.security;

import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.common.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class AdminJwtTest {

    private JwtService jwtService;
    private static final String TEST_SECRET = "subsflow-super-secure-jwt-signing-secret-key-32bytes-minimum-length!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, 3600000); // 1 hour
    }

    @Test
    void testGenerateAndValidateAdminJwtToken() {
        PlatformAdmin admin = new PlatformAdmin();
        admin.setId("admin_test_id");
        admin.setEmail("admin_test@subsflow.com");
        admin.setName("Admin Operator");
        admin.setRole("ROLE_SUBSFLOW_ADMIN");

        String token = jwtService.generateAdminToken(admin);
        assertThat(token).isNotBlank();

        // Validate token
        boolean isValid = jwtService.isTokenValid(token);
        assertThat(isValid).isTrue();

        // Extract claims
        String extractedAdminId = jwtService.extractTenantId(token); // adminId is subject
        String extractedRole = jwtService.extractRole(token);
        String extractedEmail = jwtService.extractAdminEmail(token);

        assertThat(extractedAdminId).isEqualTo("admin_test_id");
        assertThat(extractedRole).isEqualTo("ROLE_SUBSFLOW_ADMIN");
        assertThat(extractedEmail).isEqualTo("admin_test@subsflow.com");
    }

    @Test
    void testDevHash() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = 
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        boolean match = encoder.matches("SubsFlow_Dev_2026!", "$2a$10$lU2eB6B/v7XN0g8w1Z/gCeQh5z2/U92O9vU5JgK9fC5F5.D8aR1yG");
        System.out.println(">>> HASH MATCH: " + match);
        System.out.println(">>> GENERATED HASH: " + encoder.encode("SubsFlow_Dev_2026!"));
    }
}
