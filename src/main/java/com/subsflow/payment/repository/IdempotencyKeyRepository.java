package com.subsflow.payment.repository;

import com.subsflow.payment.entity.IdempotencyKey;
import com.subsflow.payment.entity.IdempotencyKeyId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, IdempotencyKeyId> {
}
