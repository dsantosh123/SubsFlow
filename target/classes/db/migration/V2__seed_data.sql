-- =========================================================================
-- V2: Seed Data for Testing
-- =========================================================================

-- Insert test tenants
INSERT INTO tenant (id, name, status, api_key, created_at, updated_at) VALUES
    ('tenant-1', 'Acme Corp', 'ACTIVE', 'sk_test_1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tenant-2', 'Globex Inc', 'ACTIVE', 'sk_test_2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed billing plans for tenant-1
-- The RLS policy requires app.current_tenant_id to be set for inserts.
-- Since Flyway runs as the DB owner (postgres), and we FORCE RLS,
-- we need to SET the tenant context before inserting tenant-scoped data.

SET app.current_tenant_id = 'tenant-1';

INSERT INTO billing_plan (id, tenant_id, name, billing_type, price, billing_period, version, created_at, updated_at) VALUES
    ('plan-flat-1', 'tenant-1', 'Pro Plan (Fixed)', 'FIXED', 100.0000, 'MONTHLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-usage-1', 'tenant-1', 'API Metered Plan', 'USAGE_BASED', 0.1000, 'MONTHLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-premium-1', 'tenant-1', 'Enterprise Plan (Fixed)', 'FIXED', 500.0000, 'MONTHLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

RESET app.current_tenant_id;

-- Seed billing plans for tenant-2
SET app.current_tenant_id = 'tenant-2';

INSERT INTO billing_plan (id, tenant_id, name, billing_type, price, billing_period, version, created_at, updated_at) VALUES
    ('plan-flat-2', 'tenant-2', 'Starter Plan (Fixed)', 'FIXED', 49.0000, 'MONTHLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-usage-2', 'tenant-2', 'Pay-as-you-go Plan', 'USAGE_BASED', 0.0500, 'MONTHLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

RESET app.current_tenant_id;
