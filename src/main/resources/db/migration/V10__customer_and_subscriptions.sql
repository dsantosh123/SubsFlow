-- V10__customer_and_subscriptions.sql
-- Phase 5: Customer Management, Subscriptions, Pricing Snapshots, Lifecycle History, and Idempotency

CREATE TABLE customer (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    external_customer_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_product_ext_id UNIQUE (product_id, external_customer_id)
);

CREATE TABLE customer_subscription (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES product_plan(id) ON DELETE RESTRICT,
    plan_version BIGINT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL,
    price_at_subscription NUMERIC(20, 4) NOT NULL,
    currency_at_subscription VARCHAR(10) NOT NULL,
    billing_interval_at_subscription VARCHAR(20) NOT NULL,
    trial_days INTEGER NOT NULL DEFAULT 0,
    features_snapshot_json TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_history (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    subscription_id VARCHAR(50) NOT NULL REFERENCES customer_subscription(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_plan_id VARCHAR(50),
    new_plan_id VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idempotency_record (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    response_status INTEGER NOT NULL,
    response_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_idempotency_tenant_key UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_customer_tenant_product ON customer(tenant_id, product_id);
CREATE INDEX idx_customer_email ON customer(email);
CREATE INDEX idx_customer_ext_id ON customer(external_customer_id);

CREATE INDEX idx_cust_sub_tenant_product ON customer_subscription(tenant_id, product_id);
CREATE INDEX idx_cust_sub_customer ON customer_subscription(customer_id);
CREATE INDEX idx_cust_sub_status ON customer_subscription(status);
CREATE INDEX idx_cust_sub_plan ON customer_subscription(plan_id);

CREATE INDEX idx_sub_hist_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_sub_hist_customer ON subscription_history(customer_id);
CREATE INDEX idx_sub_hist_tenant_product ON subscription_history(tenant_id, product_id);

CREATE INDEX idx_idempotency_tenant_key ON idempotency_record(tenant_id, idempotency_key);
