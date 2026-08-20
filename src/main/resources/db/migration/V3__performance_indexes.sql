-- =========================================================================
-- V3__performance_indexes.sql
-- High-throughput composite and partial indexes for extreme scale
-- =========================================================================

-- 1. Outbox Events: Optimize SKIP LOCKED poller query
-- Query: SELECT * FROM outbox_events WHERE status = 'PENDING' ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_outbox_events_pending_poller 
    ON outbox_events(status, created_at ASC) 
    WHERE status = 'PENDING';

-- 2. Dunning Retry Queue: Optimize scheduled retry poller
-- Query: SELECT * FROM payment_retry_queue WHERE status = 'PENDING' AND next_retry_at <= :now
CREATE INDEX IF NOT EXISTS idx_payment_retry_queue_pending 
    ON payment_retry_queue(status, next_retry_at ASC) 
    WHERE status = 'PENDING';

-- 3. Subscription Lookups: Optimize tenant subscription queries by status
CREATE INDEX IF NOT EXISTS idx_subscription_tenant_status 
    ON subscription(tenant_id, status);

-- 4. Invoices Lookups: Optimize invoice history and date range queries
CREATE INDEX IF NOT EXISTS idx_invoice_tenant_status_created 
    ON invoice(tenant_id, status, created_at DESC);

-- 5. Billing Plans: Optimize plan lookup by tenant
CREATE INDEX IF NOT EXISTS idx_billing_plan_tenant_period 
    ON billing_plan(tenant_id, billing_period);

-- 6. Usage Events: High-throughput ingestion and aggregation queries
CREATE INDEX IF NOT EXISTS idx_usage_event_sub_ts 
    ON usage_event(subscription_id, timestamp DESC);

-- 7. Payment Transactions: Fast lookup by subscription / invoice
CREATE INDEX IF NOT EXISTS idx_payment_tx_sub 
    ON payment_transaction(subscription_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_tx_invoice 
    ON payment_transaction(invoice_id);
