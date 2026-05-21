-- Phase 14: Audit Trail and Balance Adjustment Support
-- This migration adds comprehensive audit logging and balance adjustment tracking

-- ============================================
-- 1. Create audit_logs table
-- ============================================
-- Stores all system actions for audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,  -- 'balance_adjustment', 'recharge', 'subscription_add', 'subscription_remove', 'account_create', 'account_update', 'account_delete', etc.
    entity_type TEXT NOT NULL,  -- 'account', 'subscription', 'telegram_group', 'billing_cycle', 'member', 'service', etc.
    entity_id TEXT NOT NULL,
    old_value TEXT,  -- JSON format storing old value
    new_value TEXT,  -- JSON format storing new value
    reason TEXT,  -- Operation reason
    operator TEXT,  -- Operator (admin)
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator);

-- ============================================
-- 2. Create balance_adjustments table
-- ============================================
-- Tracks all balance adjustments with detailed records
CREATE TABLE IF NOT EXISTS balance_adjustments (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    old_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    adjustment_amount REAL NOT NULL,  -- Positive for increase, negative for decrease
    reason TEXT NOT NULL,
    operator TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_account ON balance_adjustments(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_created ON balance_adjustments(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_operator ON balance_adjustments(operator);

-- ============================================
-- 3. Create trigger for automatic audit logging
-- ============================================
-- This trigger automatically logs account balance changes
CREATE TRIGGER IF NOT EXISTS audit_account_balance_change
AFTER UPDATE OF balance ON accounts
BEGIN
    INSERT INTO audit_logs (
        id,
        action_type,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        operator,
        created_at
    )
    VALUES (
        'audit_' || lower(hex(randomblob(16))),
        'balance_update',
        'account',
        NEW.id,
        json_object('balance', OLD.balance),
        json_object('balance', NEW.balance),
        'Balance updated via account update',
        'system',
        CURRENT_TIMESTAMP
    );
END;

-- ============================================
-- 4. Create trigger for account creation audit
-- ============================================
CREATE TRIGGER IF NOT EXISTS audit_account_create
AFTER INSERT ON accounts
BEGIN
    INSERT INTO audit_logs (
        id,
        action_type,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        operator,
        created_at
    )
    VALUES (
        'audit_' || lower(hex(randomblob(16))),
        'account_create',
        'account',
        NEW.id,
        NULL,
        json_object('apple_id', NEW.apple_id, 'group_name', NEW.group_name, 'balance', NEW.balance),
        'Account created',
        'system',
        CURRENT_TIMESTAMP
    );
END;

-- ============================================
-- 5. Create trigger for account deletion audit
-- ============================================
CREATE TRIGGER IF NOT EXISTS audit_account_delete
BEFORE DELETE ON accounts
BEGIN
    INSERT INTO audit_logs (
        id,
        action_type,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        operator,
        created_at
    )
    VALUES (
        'audit_' || lower(hex(randomblob(16))),
        'account_delete',
        'account',
        OLD.id,
        json_object('apple_id', OLD.apple_id, 'group_name', OLD.group_name, 'balance', OLD.balance),
        NULL,
        'Account deleted',
        'system',
        CURRENT_TIMESTAMP
    );
END;

-- ============================================
-- 6. Create trigger for subscription changes audit
-- ============================================
CREATE TRIGGER IF NOT EXISTS audit_subscription_create
AFTER INSERT ON subscriptions
BEGIN
    INSERT INTO audit_logs (
        id,
        action_type,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        operator,
        created_at
    )
    VALUES (
        'audit_' || lower(hex(randomblob(16))),
        'subscription_add',
        'subscription',
        NEW.id,
        NULL,
        json_object('account_id', NEW.account_id, 'service_id', NEW.service_id, 'member_count', NEW.member_count),
        'Subscription added',
        'system',
        CURRENT_TIMESTAMP
    );
END;

CREATE TRIGGER IF NOT EXISTS audit_subscription_delete
BEFORE DELETE ON subscriptions
BEGIN
    INSERT INTO audit_logs (
        id,
        action_type,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        operator,
        created_at
    )
    VALUES (
        'audit_' || lower(hex(randomblob(16))),
        'subscription_remove',
        'subscription',
        OLD.id,
        json_object('account_id', OLD.account_id, 'service_id', OLD.service_id, 'member_count', OLD.member_count),
        NULL,
        'Subscription removed',
        'system',
        CURRENT_TIMESTAMP
    );
END;

-- ============================================
-- 7. Migration notes
-- ============================================
-- This migration adds:
-- 1. audit_logs table - comprehensive audit trail for all system operations
-- 2. balance_adjustments table - detailed tracking of balance adjustments
-- 3. Automatic triggers for common operations (account CRUD, subscription changes, recharge)
-- 
-- Manual audit logging should be used for:
-- - Balance adjustments (via balance_adjustments API)
-- - Manual operations requiring explicit reason and operator
-- - Operations that need IP address and user agent tracking
