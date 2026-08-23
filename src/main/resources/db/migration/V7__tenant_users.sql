-- V7__tenant_users.sql
-- Database changes for Phase 2: Tenant Users and Roles

CREATE TABLE tenant_user (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_tenant_user_tenant_id ON tenant_user(tenant_id);
CREATE INDEX idx_tenant_user_email ON tenant_user(email);
