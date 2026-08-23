package com.subsflow.customer.repository;

import com.subsflow.customer.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String> {
    Optional<IdempotencyRecord> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);
}
