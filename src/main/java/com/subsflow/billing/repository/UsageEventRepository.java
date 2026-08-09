package com.subsflow.billing.repository;

import com.subsflow.billing.entity.UsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsageEventRepository extends JpaRepository<UsageEvent, String> {
}
