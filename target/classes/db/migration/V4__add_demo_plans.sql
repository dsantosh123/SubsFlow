-- =========================================================================
-- V4: Seed High-Frequency Demo Billing Plans (Minute, Hourly, Daily)
-- =========================================================================

-- Seed high-frequency demo billing plans for tenant-1
SET app.current_tenant_id = 'tenant-1';

INSERT INTO billing_plan (id, tenant_id, name, billing_type, price, billing_period, version, created_at, updated_at) VALUES
    ('plan-minute-demo', 'tenant-1', 'Lightning 60s Demo Plan', 'FIXED', 5.0000, 'MINUTE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-hourly-demo', 'tenant-1', 'Hourly Compute Engine', 'FIXED', 12.5000, 'HOURLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-daily-demo', 'tenant-1', 'Daily Cloud Pod', 'FIXED', 25.0000, 'DAILY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

RESET app.current_tenant_id;

-- Seed high-frequency demo billing plans for tenant-2
SET app.current_tenant_id = 'tenant-2';

INSERT INTO billing_plan (id, tenant_id, name, billing_type, price, billing_period, version, created_at, updated_at) VALUES
    ('plan-minute-demo-t2', 'tenant-2', 'Lightning 60s Demo Plan', 'FIXED', 5.0000, 'MINUTE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan-hourly-demo-t2', 'tenant-2', 'Hourly Compute Engine', 'FIXED', 12.5000, 'HOURLY', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

RESET app.current_tenant_id;
