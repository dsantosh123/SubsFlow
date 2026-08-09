package com.subsflow.dunning.repository;

import com.subsflow.dunning.entity.PaymentRetryQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.OffsetDateTime;
import java.util.List;

public interface PaymentRetryQueueRepository extends JpaRepository<PaymentRetryQueue, String> {

    @Query(value = "SELECT * FROM payment_retry_queue WHERE status = 'PENDING' AND next_retry_at <= :now ORDER BY created_at ASC LIMIT 50 FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<PaymentRetryQueue> findPendingRetries(OffsetDateTime now);
}

