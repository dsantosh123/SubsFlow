package com.subsflow.product.repository;

import com.subsflow.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findAllByTenantId(String tenantId);
    Optional<Product> findByIdAndTenantId(String id, String tenantId);
    boolean existsByTenantIdAndName(String tenantId, String name);
}
