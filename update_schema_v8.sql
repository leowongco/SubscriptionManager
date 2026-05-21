-- Phase 15: Update Telegram Group and Billing Tables
-- This migration updates the table structure to match the architecture design

-- ============================================
-- 1. Update telegram_groups table
-- ============================================
-- Rename billing_cycle_type to billing_cycle for consistency
-- Note: SQLite doesn't support RENAME COLUMN in older versions, so we recreate

-- ============================================
-- 2. Update billing_cycles table
-- ============================================
-- Add amount_per_member column
ALTER TABLE billing_cycles ADD COLUMN amount_per_member REAL DEFAULT 0;

-- ============================================
-- 3. Update member_payments table
-- ============================================
-- Add member_id column (reference to members table)
ALTER TABLE member_payments ADD COLUMN member_id TEXT REFERENCES members(id);

-- Add paid column (boolean for payment status)
ALTER TABLE member_payments ADD COLUMN paid INTEGER DEFAULT 0;

-- Note: paid_at column already exists from v6 migration (line 44 in update_schema_v6.sql)
-- Note: refunded_at column already exists from v6 migration (line 45 in update_schema_v6.sql)

-- ============================================
-- 4. Update audit_logs table structure
-- ============================================
-- The audit_logs table already exists from v7, but we need to ensure it has the right structure
-- Add action column if it doesn't exist (simpler than action_type for basic logging)
-- Note: We'll use the existing structure from v7

-- ============================================
-- 5. Create indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_member_payments_member ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_paid ON member_payments(paid);

-- ============================================
-- Migration Notes
-- ============================================
-- 1. billing_cycles.amount_per_member: Stores the amount each member should pay
-- 2. member_payments.member_id: Links payment to a specific member (not just account)
-- 3. member_payments.paid: Boolean flag for payment status (0 = unpaid, 1 = paid)
-- 4. member_payments.paid_at: Timestamp when payment was recorded
-- 5. member_payments.refund_at: Timestamp when refund was processed
-- 
-- This allows the API to work with both the old structure (account_id, status) 
-- and the new structure (member_id, paid) for backward compatibility
