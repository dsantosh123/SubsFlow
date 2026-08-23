-- V8__products_and_credentials.sql
-- Phase 3: SaaS Product Registration, Integration Credentials, and Product Audit Trail

CREATE TABLE product (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_credential (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    client_secret_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE product_audit_log (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_tenant_id ON product(tenant_id);
CREATE INDEX idx_product_credential_client_id ON product_credential(client_id);
CREATE INDEX idx_product_credential_product_id ON product_credential(product_id);
CREATE INDEX idx_product_credential_tenant_id ON product_credential(tenant_id);
CREATE INDEX idx_product_audit_product_id ON product_audit_log(product_id);
CREATE INDEX idx_product_audit_tenant_id ON product_audit_log(tenant_id);
