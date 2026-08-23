-- V13__admin_enhancements.sql
-- Database enhancements for Platform Administration & Management

-- 1. Extend platform_admin table with status
ALTER TABLE platform_admin ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 2. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_setting (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed Default Platform Settings
INSERT INTO platform_setting (key, value, description)
VALUES 
    ('platform_name', 'SubsFlow Cloud', 'Public branding name of the SaaS billing platform'),
    ('support_email', 'ops@subsflow.com', 'Internal contact email for escalations and system alerts'),
    ('default_timezone', 'UTC', 'Default platform operational timezone'),
    ('default_currency', 'USD', 'Default currency standard for transactions'),
    ('webhook_max_retries', '5', 'Global maximum retry count for failed outbound webhook dispatches'),
    ('session_timeout_hours', '24', 'Default duration for administrative and tenant JWT sessions')
ON CONFLICT (key) DO NOTHING;
