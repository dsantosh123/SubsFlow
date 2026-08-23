package com.subsflow.product.repository;

import com.subsflow.product.entity.ProductCredential;
import com.subsflow.product.entity.ProductCredentialStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductCredentialRepository extends JpaRepository<ProductCredential, String> {
    Optional<ProductCredential> findByClientId(String clientId);
    Optional<ProductCredential> findByProductIdAndStatus(String productId, ProductCredentialStatus status);
    List<ProductCredential> findAllByProductId(String productId);
    List<ProductCredential> findAllByTenantId(String tenantId);
}
