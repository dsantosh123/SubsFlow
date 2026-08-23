package com.subsflow.tenant.repository;

import com.subsflow.tenant.entity.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TenantUserRepository extends JpaRepository<TenantUser, String> {
    Optional<TenantUser> findByEmail(String email);
    Optional<TenantUser> findByTenantIdAndEmail(String tenantId, String email);
    List<TenantUser> findAllByTenantId(String tenantId);
    boolean existsByTenantIdAndEmail(String tenantId, String email);
}
