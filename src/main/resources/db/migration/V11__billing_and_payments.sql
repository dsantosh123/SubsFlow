-- V11__billing_and_payments.sql
-- Phase 6: Billing Accounts, Payment Methods, Invoices, Payments, Refunds, and Webhook Deduplication

CREATE TABLE billing_account (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_customer_id VARCHAR(100),
    billing_email VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_billing_account_cust_prod UNIQUE (product_id, customer_id)
);

CREATE TABLE payment_method_reference (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_payment_method_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'CARD',
    last4 VARCHAR(4),
    brand VARCHAR(50),
    exp_month INTEGER,
    exp_year INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_invoice (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    subscription_id VARCHAR(50) NOT NULL REFERENCES customer_subscription(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    subtotal NUMERIC(20, 4) NOT NULL,
    discount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,
    tax NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,
    total NUMERIC(20, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_invoice_num UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE customer_payment (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    subscription_id VARCHAR(50) NOT NULL REFERENCES customer_subscription(id) ON DELETE CASCADE,
    invoice_id VARCHAR(50) REFERENCES customer_invoice(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(100),
    amount NUMERIC(20, 4) NOT NULL,
    refunded_amount NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_method_reference VARCHAR(100),
    failure_code VARCHAR(100),
    failure_message TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_refund (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    payment_id VARCHAR(50) NOT NULL REFERENCES customer_payment(id) ON DELETE CASCADE,
    amount NUMERIC(20, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    reason VARCHAR(255),
    performed_by VARCHAR(255),
    provider_refund_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCEEDED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_event (
    id VARCHAR(50) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_webhook_event_provider_id UNIQUE (provider, event_id)
);

CREATE INDEX idx_billing_account_cust ON billing_account(customer_id);
CREATE INDEX idx_payment_method_cust ON payment_method_reference(customer_id);

CREATE INDEX idx_cust_inv_tenant_product ON customer_invoice(tenant_id, product_id);
CREATE INDEX idx_cust_inv_customer ON customer_invoice(customer_id);
CREATE INDEX idx_cust_inv_sub ON customer_invoice(subscription_id);
CREATE INDEX idx_cust_inv_status ON customer_invoice(status);

CREATE INDEX idx_cust_pay_tenant_product ON customer_payment(tenant_id, product_id);
CREATE INDEX idx_cust_pay_customer ON customer_payment(customer_id);
CREATE INDEX idx_cust_pay_sub ON customer_payment(subscription_id);
CREATE INDEX idx_cust_pay_inv ON customer_payment(invoice_id);
CREATE INDEX idx_cust_pay_status ON customer_payment(status);
CREATE INDEX idx_cust_pay_provider_id ON customer_payment(provider, provider_payment_id);

CREATE INDEX idx_pay_refund_pay ON payment_refund(payment_id);
CREATE INDEX idx_webhook_event_lookup ON webhook_event(provider, event_id);
