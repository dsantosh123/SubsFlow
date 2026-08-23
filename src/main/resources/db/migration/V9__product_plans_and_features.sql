-- V9__product_plans_and_features.sql
-- Phase 4: SaaS Product Plans, Pricing, Feature Limits, and Plan Audit Trail

CREATE TABLE product_plan (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    price NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    trial_days INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_plan_product_name UNIQUE (product_id, name)
);

CREATE TABLE plan_feature (
    id VARCHAR(50) PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL REFERENCES product_plan(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_plan_feature_plan_key UNIQUE (plan_id, feature_key)
);

CREATE TABLE plan_audit_log (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    plan_id VARCHAR(50) NOT NULL REFERENCES product_plan(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_plan_tenant_id ON product_plan(tenant_id);
CREATE INDEX idx_product_plan_product_id ON product_plan(product_id);
CREATE INDEX idx_product_plan_catalog ON product_plan(product_id, status, visibility);
CREATE INDEX idx_plan_feature_plan_id ON plan_feature(plan_id);
CREATE INDEX idx_plan_audit_plan_id ON plan_audit_log(plan_id);
