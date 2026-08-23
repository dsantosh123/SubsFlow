package com.subsflow.tenant.repository;

import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, String> {
    Optional<Tenant> findByApiKey(String apiKey);

    long countByStatus(TenantStatus status);

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.createdAt >= :date")
    long countByCreatedAtAfter(@Param("date") OffsetDateTime date);

    @Query("SELECT t FROM Tenant t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(t.id) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(t.ownerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(t.contactEmail) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR t.status = :status)")
    Page<Tenant> findAllWithSearchAndFilter(@Param("search") String search, @Param("status") TenantStatus status, Pageable pageable);
}
