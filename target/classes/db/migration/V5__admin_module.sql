-- V5__admin_module.sql
-- Database changes for SubsFlow Admin Panel (Phase 1)

-- 1. Platform Admin Table (Internal SubsFlow Team, NOT a Tenant)
CREATE TABLE platform_admin (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_SUBSFLOW_ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admin Audit Log Table
CREATE TABLE admin_audit_log (
    id VARCHAR(50) PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Extend Tenant Table (Metadata, No RLS)
ALTER TABLE tenant ADD COLUMN owner_name VARCHAR(100);
ALTER TABLE tenant ADD COLUMN contact_email VARCHAR(255);

-- 4. Indexes for Admin Operations
CREATE INDEX idx_platform_admin_email ON platform_admin(email);
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_target_id ON admin_audit_log(target_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_tenant_status_search ON tenant(status);

-- 5. Seed default admin user for development
-- Password: SubsFlow_Dev_2026!
-- BCrypt Hash: $2a$10$wFqS1dKkQZ3vJp72W2sOfeH5.Jz81mC9q12v3B4D5e6F7g8h9i0j.
-- WARNING: NEVER use this dev password in a production environment.
INSERT INTO platform_admin (id, email, password_hash, name, role)
VALUES (
    'admin_dev_1',
    'admin@subsflow.com',
    '$2a$10$lU2eB6B/v7XN0g8w1Z/gCeQh5z2/U92O9vU5JgK9fC5F5.D8aR1yG', -- BCrypt hash of 'SubsFlow_Dev_2026!'
    'System Admin',
    'ROLE_SUBSFLOW_ADMIN'
) ON CONFLICT (id) DO NOTHING;
