package com.subsflow.plan.repository;

import com.subsflow.plan.entity.PlanStatus;
import com.subsflow.plan.entity.PlanVisibility;
import com.subsflow.plan.entity.ProductPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductPlanRepository extends JpaRepository<ProductPlan, String> {
    List<ProductPlan> findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(String productId);
    Optional<ProductPlan> findByIdAndProductId(String id, String productId);
    Optional<ProductPlan> findByIdAndTenantId(String id, String tenantId);
    boolean existsByProductIdAndNameIgnoreCase(String productId, String name);
    boolean existsByProductIdAndNameIgnoreCaseAndIdNot(String productId, String name, String id);
    List<ProductPlan> findAllByProductIdAndStatusAndVisibilityOrderByDisplayOrderAsc(String productId, PlanStatus status, PlanVisibility visibility);
}
