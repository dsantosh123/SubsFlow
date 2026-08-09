package com.subsflow.subscription.repository;

import com.subsflow.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, String> {

    @Query(value = "SELECT * FROM subscription WHERE status IN ('ACTIVE', 'TRIAL') AND current_period_end <= :now ORDER BY current_period_end ASC LIMIT 100 FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<Subscription> findDueSubscriptions(OffsetDateTime now);
}
