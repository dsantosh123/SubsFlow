package com.subsflow.plan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "plan_feature", uniqueConstraints = {
    @UniqueConstraint(name = "uq_plan_feature_plan_key", columnNames = {"plan_id", "feature_key"})
})
@Getter
@Setter
public class PlanFeature {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    @JsonIgnore
    private ProductPlan plan;

    @Column(name = "feature_key", nullable = false, length = 100)
    private String featureKey;

    @Column(name = "feature_name", nullable = false, length = 100)
    private String featureName;

    @Column(nullable = false)
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false)
    private FeatureValueType valueType = FeatureValueType.TEXT;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
