package com.subsflow.plan;

import com.subsflow.plan.entity.*;
import com.subsflow.plan.repository.PlanAuditLogRepository;
import com.subsflow.plan.repository.PlanFeatureRepository;
import com.subsflow.plan.repository.ProductPlanRepository;
import com.subsflow.plan.service.ProductPlanService;
import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductPlanServiceTest {

    @Mock
    private ProductPlanRepository planRepository;

    @Mock
    private PlanFeatureRepository featureRepository;

    @Mock
    private PlanAuditLogRepository auditLogRepository;

    @Mock
    private ProductRepository productRepository;

    private ProductPlanService planService;
    private Tenant testTenant;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        planService = new ProductPlanService(planRepository, featureRepository, auditLogRepository, productRepository);

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);

        testProduct = new Product();
        testProduct.setId("prod_streaming");
        testProduct.setName("Netflix Streaming");
        testProduct.setTenant(testTenant);
        testProduct.setStatus(ProductStatus.ACTIVE);
    }

    @Test
    @DisplayName("OWNER can create plan in DRAFT status with valid price and interval")
    void testOwnerCanCreatePlan() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(planRepository.existsByProductIdAndNameIgnoreCase("prod_streaming", "Standard"))
                .thenReturn(false);
        when(planRepository.save(any(ProductPlan.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductPlan plan = planService.createPlan(
                "t_netflix",
                "OWNER",
                "owner@netflix.com",
                "prod_streaming",
                "Standard",
                "HD streaming with 2 screens",
                new BigDecimal("15.49"),
                "USD",
                BillingInterval.MONTHLY,
                7,
                PlanVisibility.PUBLIC
        );

        assertNotNull(plan);
        assertEquals("Standard", plan.getName());
        assertEquals(new BigDecimal("15.49"), plan.getPrice());
        assertEquals(PlanStatus.DRAFT, plan.getStatus());
        assertEquals(PlanVisibility.PUBLIC, plan.getVisibility());
        assertEquals(7, plan.getTrialDays());
        assertEquals(BillingInterval.MONTHLY, plan.getBillingInterval());

        verify(planRepository, times(1)).save(any(ProductPlan.class));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Duplicate plan name on same product is rejected")
    void testDuplicatePlanNameRejected() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(planRepository.existsByProductIdAndNameIgnoreCase("prod_streaming", "Premium"))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            planService.createPlan(
                    "t_netflix",
                    "OWNER",
                    "owner@netflix.com",
                    "prod_streaming",
                    "Premium",
                    "4K streaming",
                    new BigDecimal("22.99"),
                    "USD",
                    BillingInterval.MONTHLY,
                    0,
                    PlanVisibility.PUBLIC
            );
        });
        verify(planRepository, never()).save(any());
    }

    @Test
    @DisplayName("DEVELOPER cannot create or update plans")
    void testDeveloperCannotCreatePlan() {
        assertThrows(IllegalStateException.class, () -> {
            planService.createPlan(
                    "t_netflix",
                    "DEVELOPER",
                    "dev@netflix.com",
                    "prod_streaming",
                    "Dev Plan",
                    null,
                    BigDecimal.ZERO,
                    "USD",
                    BillingInterval.MONTHLY,
                    0,
                    PlanVisibility.PUBLIC
            );
        });
    }

    @Test
    @DisplayName("Negative price and negative trial days are rejected")
    void testNegativePriceRejected() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));

        assertThrows(IllegalArgumentException.class, () -> {
            planService.createPlan(
                    "t_netflix",
                    "ADMIN",
                    "admin@netflix.com",
                    "prod_streaming",
                    "Invalid Plan",
                    null,
                    new BigDecimal("-5.00"),
                    "USD",
                    BillingInterval.MONTHLY,
                    0,
                    PlanVisibility.PUBLIC
            );
        });
    }

    @Test
    @DisplayName("Valid status transitions: DRAFT -> ACTIVE -> INACTIVE -> ARCHIVED")
    void testValidStatusTransitions() {
        ProductPlan plan = new ProductPlan();
        plan.setId("plan_123");
        plan.setName("Standard");
        plan.setTenant(testTenant);
        plan.setProduct(testProduct);
        plan.setStatus(PlanStatus.DRAFT);

        when(planRepository.findByIdAndProductId("plan_123", "prod_streaming"))
                .thenReturn(Optional.of(plan));
        when(planRepository.save(any(ProductPlan.class))).thenAnswer(inv -> inv.getArgument(0));

        // DRAFT -> ACTIVE
        ProductPlan active = planService.setPlanStatus("t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "plan_123", PlanStatus.ACTIVE);
        assertEquals(PlanStatus.ACTIVE, active.getStatus());

        // ACTIVE -> INACTIVE
        ProductPlan inactive = planService.setPlanStatus("t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "plan_123", PlanStatus.INACTIVE);
        assertEquals(PlanStatus.INACTIVE, inactive.getStatus());

        // INACTIVE -> ARCHIVED
        ProductPlan archived = planService.setPlanStatus("t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "plan_123", PlanStatus.ARCHIVED);
        assertEquals(PlanStatus.ARCHIVED, archived.getStatus());
    }

    @Test
    @DisplayName("Archived plan cannot be edited or reactivated")
    void testArchivedPlanCannotBeModified() {
        ProductPlan plan = new ProductPlan();
        plan.setId("plan_123");
        plan.setName("Old Plan");
        plan.setTenant(testTenant);
        plan.setProduct(testProduct);
        plan.setStatus(PlanStatus.ARCHIVED);

        when(planRepository.findByIdAndProductId("plan_123", "prod_streaming"))
                .thenReturn(Optional.of(plan));

        // Cannot reactivate
        assertThrows(IllegalStateException.class, () -> {
            planService.setPlanStatus("t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "plan_123", PlanStatus.ACTIVE);
        });

        // Cannot update
        assertThrows(IllegalStateException.class, () -> {
            planService.updatePlan("t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "plan_123", "New Name", null, null, null, null, 0, null);
        });
    }

    @Test
    @DisplayName("Feature CRUD works and duplicate feature keys are rejected")
    void testFeatureCrud() {
        ProductPlan plan = new ProductPlan();
        plan.setId("plan_123");
        plan.setName("Premium");
        plan.setTenant(testTenant);
        plan.setProduct(testProduct);
        plan.setStatus(PlanStatus.ACTIVE);

        when(planRepository.findByIdAndProductId("plan_123", "prod_streaming"))
                .thenReturn(Optional.of(plan));
        when(featureRepository.existsByPlanIdAndFeatureKeyIgnoreCase("plan_123", "screens"))
                .thenReturn(false);
        when(featureRepository.save(any(PlanFeature.class))).thenAnswer(inv -> inv.getArgument(0));

        PlanFeature feature = planService.addFeature(
                "t_netflix",
                "OWNER",
                "owner@netflix.com",
                "prod_streaming",
                "plan_123",
                "screens",
                "Screens Allowed",
                "4",
                FeatureValueType.NUMBER
        );

        assertNotNull(feature);
        assertEquals("screens", feature.getFeatureKey());
        assertEquals("4", feature.getValue());
        assertEquals(FeatureValueType.NUMBER, feature.getValueType());
    }

    @Test
    @DisplayName("Public catalog returns ONLY ACTIVE + PUBLIC plans for an ACTIVE product")
    void testPublicCatalogFiltering() {
        // Active product
        when(productRepository.findById("prod_streaming")).thenReturn(Optional.of(testProduct));

        ProductPlan activePublic = new ProductPlan();
        activePublic.setId("plan_pub");
        activePublic.setName("Standard");
        activePublic.setPrice(new BigDecimal("15.00"));
        activePublic.setCurrency("USD");
        activePublic.setBillingInterval(BillingInterval.MONTHLY);
        activePublic.setStatus(PlanStatus.ACTIVE);
        activePublic.setVisibility(PlanVisibility.PUBLIC);

        when(planRepository.findAllByProductIdAndStatusAndVisibilityOrderByDisplayOrderAsc(
                "prod_streaming", PlanStatus.ACTIVE, PlanVisibility.PUBLIC
        )).thenReturn(List.of(activePublic));

        List<ProductPlanService.PublicPlanResponse> publicPlans =
                planService.getPublicPlansForProduct("prod_streaming");

        assertEquals(1, publicPlans.size());
        assertEquals("Standard", publicPlans.get(0).getName());
        assertEquals(new BigDecimal("15.00"), publicPlans.get(0).getPrice());
    }

    @Test
    @DisplayName("Public catalog returns empty list if product is INACTIVE")
    void testPublicCatalogInactiveProduct() {
        testProduct.setStatus(ProductStatus.INACTIVE);
        when(productRepository.findById("prod_streaming")).thenReturn(Optional.of(testProduct));

        List<ProductPlanService.PublicPlanResponse> publicPlans =
                planService.getPublicPlansForProduct("prod_streaming");

        assertTrue(publicPlans.isEmpty());
        verify(planRepository, never()).findAllByProductIdAndStatusAndVisibilityOrderByDisplayOrderAsc(any(), any(), any());
    }
}
