package com.subsflow.billing.repository;

import com.subsflow.billing.entity.UsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public interface UsageEventRepository extends JpaRepository<UsageEvent, String> {

    @Query("SELECT COALESCE(SUM(u.quantity), 0) FROM UsageEvent u WHERE u.subscription.id = :subscriptionId AND u.timestamp >= :periodStart AND u.timestamp < :periodEnd")
    BigDecimal sumUsageForPeriod(@Param("subscriptionId") String subscriptionId, @Param("periodStart") OffsetDateTime periodStart, @Param("periodEnd") OffsetDateTime periodEnd);
}
