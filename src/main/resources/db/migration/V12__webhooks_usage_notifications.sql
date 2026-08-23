-- V12__webhooks_usage_notifications.sql
-- Phase 7: Webhook Endpoints, Delivery Tracking, Usage Events, Notifications, and Preferences

-- 1. Enhance Webhook Event table
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE webhook_event ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Webhook Endpoint table (Outbound)
CREATE TABLE webhook_endpoint (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    subscribed_events TEXT NOT NULL DEFAULT '*',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Webhook Delivery Log table
CREATE TABLE webhook_delivery (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    endpoint_id VARCHAR(50) NOT NULL REFERENCES webhook_endpoint(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    last_attempted_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Usage Event table
CREATE TABLE customer_usage_event (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    subscription_id VARCHAR(50) NOT NULL REFERENCES customer_subscription(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    quantity NUMERIC(20, 4) NOT NULL DEFAULT 1.0000,
    idempotency_key VARCHAR(255),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usage_event_idem UNIQUE (tenant_id, idempotency_key)
);

-- 5. Notification table
CREATE TABLE notification (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES customer(id) ON DELETE SET NULL,
    subscription_id VARCHAR(50) REFERENCES customer_subscription(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notification Preference table
CREATE TABLE notification_preference (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notif_pref_prod_event UNIQUE (product_id, event_type)
);

CREATE INDEX idx_whe_tenant_product ON webhook_endpoint(tenant_id, product_id);
CREATE INDEX idx_whd_endpoint ON webhook_delivery(endpoint_id);
CREATE INDEX idx_whd_tenant_product ON webhook_delivery(tenant_id, product_id);
CREATE INDEX idx_whd_status ON webhook_delivery(status);

CREATE INDEX idx_usage_tenant_prod_cust ON customer_usage_event(tenant_id, product_id, customer_id);
CREATE INDEX idx_usage_sub ON customer_usage_event(subscription_id);
CREATE INDEX idx_usage_feature ON customer_usage_event(feature_key);
CREATE INDEX idx_usage_occurred ON customer_usage_event(occurred_at);

CREATE INDEX idx_notif_tenant_prod ON notification(tenant_id, product_id);
CREATE INDEX idx_notif_status ON notification(status);
CREATE INDEX idx_notif_created ON notification(created_at);
