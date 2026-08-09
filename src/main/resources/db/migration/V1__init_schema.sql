-- Enable uuid-ossp just in case we need UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenant Table (Metadata, No RLS)
CREATE TABLE tenant (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_api_key ON tenant(api_key);

-- 2. Billing Plan Table
CREATE TABLE billing_plan (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    billing_type VARCHAR(50) NOT NULL,
    price NUMERIC(20, 4) NOT NULL,
    billing_period VARCHAR(50) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscription Table
CREATE TABLE subscription (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL REFERENCES billing_plan(id),
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Usage Event Table
CREATE TABLE usage_event (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50) NOT NULL REFERENCES subscription(id),
    quantity NUMERIC(20, 4) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Invoice Table
CREATE TABLE invoice (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50) NOT NULL REFERENCES subscription(id),
    status VARCHAR(50) NOT NULL,
    amount NUMERIC(20, 4) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Invoice Line Item Table
CREATE TABLE invoice_line_item (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES billing_plan(id),
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(20, 4) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payment Transaction Table
CREATE TABLE payment_transaction (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(50) REFERENCES subscription(id),
    invoice_id VARCHAR(50) REFERENCES invoice(id),
    amount NUMERIC(20, 4) NOT NULL,
    status VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(255),
    gateway_reference VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payment Retry Queue Table (Dunning)
CREATE TABLE payment_retry_queue (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(50) NOT NULL REFERENCES payment_transaction(id),
    retry_count INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Outbox Events Table
CREATE TABLE outbox_events (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Idempotency Key Table
CREATE TABLE idempotency_key (
    key VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, key)
);

-- =========================================================================
-- Enable Row-Level Security (RLS) and Create Policies
-- =========================================================================

-- We enable RLS on all tenant-specific tables and use the custom DB session
-- variable 'app.current_tenant_id' to isolate queries.

-- billing_plan
ALTER TABLE billing_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plan FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON billing_plan FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- subscription
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON subscription FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- usage_event
ALTER TABLE usage_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_event FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON usage_event FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- invoice
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON invoice FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- invoice_line_item
ALTER TABLE invoice_line_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_item FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON invoice_line_item FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- payment_transaction
ALTER TABLE payment_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transaction FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON payment_transaction FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- payment_retry_queue
ALTER TABLE payment_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_retry_queue FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON payment_retry_queue FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- outbox_events
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON outbox_events FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- idempotency_key
ALTER TABLE idempotency_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_key FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON idempotency_key FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));
