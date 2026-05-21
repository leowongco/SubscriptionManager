-- Phase 13: Telegram Group Management Support
-- This migration adds support for Telegram group billing cycle management

-- ============================================
-- 1. Create telegram_groups table
-- ============================================
-- Stores Telegram group information for billing management
CREATE TABLE IF NOT EXISTS telegram_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    telegram_link TEXT,
    billing_day INTEGER DEFAULT 6,
    billing_cycle_type TEXT DEFAULT 'biannual',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Create billing_cycles table
-- ============================================
-- Tracks billing cycles for each Telegram group
CREATE TABLE IF NOT EXISTS billing_cycles (
    id TEXT PRIMARY KEY,
    telegram_group_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    total_amount REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_group_id) REFERENCES telegram_groups(id)
);

-- ============================================
-- 3. Create member_payments table
-- ============================================
-- Tracks individual member payments within a billing cycle
CREATE TABLE IF NOT EXISTS member_payments (
    id TEXT PRIMARY KEY,
    billing_cycle_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at TEXT,
    refunded_at TEXT,
    refund_amount REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- ============================================
-- 4. Modify subscriptions table
-- ============================================
-- Add telegram_group_id to link subscriptions to Telegram groups
ALTER TABLE subscriptions ADD COLUMN telegram_group_id TEXT;

-- Add service_account to store the service-specific account identifier
ALTER TABLE subscriptions ADD COLUMN service_account TEXT;

-- ============================================
-- 5. Create indexes for performance
-- ============================================
-- Index for querying groups by billing day
CREATE INDEX IF NOT EXISTS idx_telegram_groups_billing_day ON telegram_groups(billing_day);

-- Index for querying billing cycles by group
CREATE INDEX IF NOT EXISTS idx_billing_cycles_group ON billing_cycles(telegram_group_id);

-- Index for querying member payments by cycle
CREATE INDEX IF NOT EXISTS idx_member_payments_cycle ON member_payments(billing_cycle_id);

-- Index for querying subscriptions by telegram group
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_group ON subscriptions(telegram_group_id);

-- ============================================
-- Migration Notes
-- ============================================
-- 1. telegram_groups: Stores Telegram group information including billing preferences
-- 2. billing_cycles: Tracks billing periods for each group (e.g., Jan-Jun, Jul-Dec for biannual)
-- 3. member_payments: Records individual payment status for members within each cycle
-- 4. subscriptions.telegram_group_id: Links subscriptions to their managing Telegram group
-- 5. subscriptions.service_account: Stores service-specific account identifier (e.g., Apple ID, Google email)
-- 
-- Status values for billing_cycles: 'active', 'closed', 'archived'
-- Status values for member_payments: 'pending', 'paid', 'refunded', 'waived'
-- billing_cycle_type values: 'monthly', 'quarterly', 'biannual', 'annual'
