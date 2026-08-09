package com.subsflow.subscription.repository;

import com.subsflow.subscription.entity.BillingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingPlanRepository extends JpaRepository<BillingPlan, String> {
}
