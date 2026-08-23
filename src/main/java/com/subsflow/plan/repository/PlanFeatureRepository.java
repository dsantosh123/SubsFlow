package com.subsflow.plan.repository;

import com.subsflow.plan.entity.PlanFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlanFeatureRepository extends JpaRepository<PlanFeature, String> {
    List<PlanFeature> findAllByPlanIdOrderByDisplayOrderAsc(String planId);
    Optional<PlanFeature> findByIdAndPlanId(String id, String planId);
    boolean existsByPlanIdAndFeatureKeyIgnoreCase(String planId, String featureKey);
    boolean existsByPlanIdAndFeatureKeyIgnoreCaseAndIdNot(String planId, String featureKey, String id);
}
