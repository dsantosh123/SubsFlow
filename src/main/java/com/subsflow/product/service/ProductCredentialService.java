package com.subsflow.product.service;

import com.subsflow.product.entity.*;
import com.subsflow.product.repository.ProductAuditLogRepository;
import com.subsflow.product.repository.ProductCredentialRepository;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ProductCredentialService {

    private final ProductRepository productRepository;
    private final ProductCredentialRepository credentialRepository;
    private final ProductAuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();

    public ProductCredentialService(ProductRepository productRepository,
                                    ProductCredentialRepository credentialRepository,
                                    ProductAuditLogRepository auditLogRepository,
                                    TenantRepository tenantRepository) {
        this.productRepository = productRepository;
        this.credentialRepository = credentialRepository;
        this.auditLogRepository = auditLogRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public CredentialGeneratedResponse generateCredentials(String tenantId, String productId, String actorEmail) {
        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        // Revoke any existing active credentials
        Optional<ProductCredential> existingOpt = credentialRepository.findByProductIdAndStatus(productId, ProductCredentialStatus.ACTIVE);
        existingOpt.ifPresent(existing -> {
            existing.setStatus(ProductCredentialStatus.REVOKED);
            existing.setRevokedAt(OffsetDateTime.now());
            credentialRepository.save(existing);
        });

        String clientId = "cid_" + generateSecureToken(16);
        String rawClientSecret = "cs_live_" + generateSecureToken(32);
        String secretHash = passwordEncoder.encode(rawClientSecret);

        ProductCredential credential = new ProductCredential();
        credential.setId("pcred_" + UUID.randomUUID().toString().substring(0, 8));
        credential.setProduct(product);
        credential.setTenant(product.getTenant());
        credential.setClientId(clientId);
        credential.setClientSecretHash(secretHash);
        credential.setStatus(ProductCredentialStatus.ACTIVE);
        credentialRepository.save(credential);

        // Audit log
        ProductAuditLog audit = new ProductAuditLog();
        audit.setId("pal_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setProduct(product);
        audit.setTenant(product.getTenant());
        audit.setAction(existingOpt.isPresent() ? ProductAuditAction.CREDENTIAL_ROTATED : ProductAuditAction.CREDENTIAL_CREATED);
        audit.setPerformedBy(actorEmail);
        audit.setDetails("Generated API credentials with client ID: " + clientId);
        auditLogRepository.save(audit);

        return new CredentialGeneratedResponse(
                credential.getId(),
                clientId,
                rawClientSecret,
                credential.getStatus().name(),
                credential.getCreatedAt()
        );
    }

    @Transactional
    public CredentialGeneratedResponse rotateCredentials(String tenantId, String productId, String actorEmail) {
        return generateCredentials(tenantId, productId, actorEmail);
    }

    @Transactional
    public void revokeCredentials(String tenantId, String productId, String actorEmail) {
        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        Optional<ProductCredential> activeOpt = credentialRepository.findByProductIdAndStatus(productId, ProductCredentialStatus.ACTIVE);
        if (activeOpt.isEmpty()) {
            throw new IllegalStateException("No active credentials found to revoke");
        }

        ProductCredential cred = activeOpt.get();
        cred.setStatus(ProductCredentialStatus.REVOKED);
        cred.setRevokedAt(OffsetDateTime.now());
        credentialRepository.save(cred);

        // Audit log
        ProductAuditLog audit = new ProductAuditLog();
        audit.setId("pal_" + UUID.randomUUID().toString().substring(0, 8));
        audit.setProduct(product);
        audit.setTenant(product.getTenant());
        audit.setAction(ProductAuditAction.CREDENTIAL_REVOKED);
        audit.setPerformedBy(actorEmail);
        audit.setDetails("Revoked credentials for client ID: " + cred.getClientId());
        auditLogRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCredentialMetadata(String tenantId, String productId) {
        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));

        Optional<ProductCredential> activeOpt = credentialRepository.findByProductIdAndStatus(productId, ProductCredentialStatus.ACTIVE);

        if (activeOpt.isEmpty()) {
            return Map.of(
                    "productId", productId,
                    "hasActiveCredentials", false,
                    "status", "NO_CREDENTIALS"
            );
        }

        ProductCredential cred = activeOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId);
        response.put("hasActiveCredentials", true);
        response.put("credentialId", cred.getId());
        response.put("clientId", cred.getClientId());
        response.put("status", cred.getStatus().name());
        response.put("createdAt", cred.getCreatedAt());
        response.put("lastUsedAt", cred.getLastUsedAt());
        return response;
    }

    @Transactional
    public Optional<ProductCredential> verifyAndAuthenticate(String clientId, String rawSecret) {
        if (clientId == null || rawSecret == null) {
            return Optional.empty();
        }

        Optional<ProductCredential> credOpt = credentialRepository.findByClientId(clientId.trim());
        if (credOpt.isEmpty()) {
            return Optional.empty();
        }

        ProductCredential cred = credOpt.get();
        if (cred.getStatus() != ProductCredentialStatus.ACTIVE) {
            return Optional.empty();
        }

        if (!passwordEncoder.matches(rawSecret.trim(), cred.getClientSecretHash())) {
            return Optional.empty();
        }

        // Update last used timestamp
        cred.setLastUsedAt(OffsetDateTime.now());
        credentialRepository.save(cred);

        return Optional.of(cred);
    }

    private String generateSecureToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).replace("-", "").replace("_", "");
    }

    public static class CredentialGeneratedResponse {
        private final String id;
        private final String clientId;
        private final String clientSecret;
        private final String status;
        private final OffsetDateTime createdAt;

        public CredentialGeneratedResponse(String id, String clientId, String clientSecret, String status, OffsetDateTime createdAt) {
            this.id = id;
            this.clientId = clientId;
            this.clientSecret = clientSecret;
            this.status = status;
            this.createdAt = createdAt;
        }

        public String getId() { return id; }
        public String getClientId() { return clientId; }
        public String getClientSecret() { return clientSecret; }
        public String getStatus() { return status; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
    }
}
