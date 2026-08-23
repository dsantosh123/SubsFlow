package com.subsflow.product;

import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductCredential;
import com.subsflow.product.entity.ProductCredentialStatus;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductAuditLogRepository;
import com.subsflow.product.repository.ProductCredentialRepository;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.product.service.ProductCredentialService;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductCredentialServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductCredentialRepository credentialRepository;

    @Mock
    private ProductAuditLogRepository auditLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    private ProductCredentialService credentialService;
    private Tenant testTenant;
    private Product testProduct;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        credentialService = new ProductCredentialService(
                productRepository,
                credentialRepository,
                auditLogRepository,
                tenantRepository
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
    }

    @Test
    @DisplayName("Generate credentials returns raw secret and saves hash")
    void testGenerateCredentials() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(credentialRepository.findByProductIdAndStatus("prod_streaming", ProductCredentialStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(credentialRepository.save(any(ProductCredential.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductCredentialService.CredentialGeneratedResponse res =
                credentialService.generateCredentials("t_netflix", "prod_streaming", "owner@netflix.com");

        assertNotNull(res);
        assertNotNull(res.getClientId());
        assertTrue(res.getClientId().startsWith("cid_"));
        assertNotNull(res.getClientSecret());
        assertTrue(res.getClientSecret().startsWith("cs_live_"));
        assertEquals("ACTIVE", res.getStatus());

        verify(credentialRepository, times(1)).save(any(ProductCredential.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Verify and authenticate succeeds with correct raw secret")
    void testVerifyCredentialsSuccess() {
        String rawSecret = "cs_live_sampleSecret1234567890abcdef";
        String hashed = encoder.encode(rawSecret);

        ProductCredential cred = new ProductCredential();
        cred.setId("pcred_1");
        cred.setClientId("cid_netflix_test");
        cred.setClientSecretHash(hashed);
        cred.setStatus(ProductCredentialStatus.ACTIVE);
        cred.setProduct(testProduct);
        cred.setTenant(testTenant);

        when(credentialRepository.findByClientId("cid_netflix_test")).thenReturn(Optional.of(cred));
        when(credentialRepository.save(any(ProductCredential.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<ProductCredential> authOpt = credentialService.verifyAndAuthenticate("cid_netflix_test", rawSecret);

        assertTrue(authOpt.isPresent());
        assertEquals("pcred_1", authOpt.get().getId());
        assertNotNull(authOpt.get().getLastUsedAt());
    }

    @Test
    @DisplayName("Verify and authenticate fails with wrong secret")
    void testVerifyCredentialsWrongSecret() {
        String hashed = encoder.encode("correct_secret");

        ProductCredential cred = new ProductCredential();
        cred.setId("pcred_1");
        cred.setClientId("cid_netflix_test");
        cred.setClientSecretHash(hashed);
        cred.setStatus(ProductCredentialStatus.ACTIVE);

        when(credentialRepository.findByClientId("cid_netflix_test")).thenReturn(Optional.of(cred));

        Optional<ProductCredential> authOpt = credentialService.verifyAndAuthenticate("cid_netflix_test", "wrong_secret");

        assertFalse(authOpt.isPresent());
    }

    @Test
    @DisplayName("Revoked credentials cannot authenticate")
    void testRevokedCredentialsFailAuth() {
        String rawSecret = "secret123";
        String hashed = encoder.encode(rawSecret);

        ProductCredential cred = new ProductCredential();
        cred.setId("pcred_1");
        cred.setClientId("cid_netflix_test");
        cred.setClientSecretHash(hashed);
        cred.setStatus(ProductCredentialStatus.REVOKED);

        when(credentialRepository.findByClientId("cid_netflix_test")).thenReturn(Optional.of(cred));

        Optional<ProductCredential> authOpt = credentialService.verifyAndAuthenticate("cid_netflix_test", rawSecret);

        assertFalse(authOpt.isPresent());
    }
}
