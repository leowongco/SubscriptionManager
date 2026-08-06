-- SubscriptionManager 自架版資料庫結構
-- 整合自 schema.sql + update_schema_v2~v9.sql,並修正本次審查中發現的問題：
--   - accounts 不含 group_name（v4 已棄用，改用 subscriptions.group_name）
--   - 不使用 DB trigger 自動寫 audit_logs，改由應用層（server/src/lib/audit.ts）統一寫入，
--     避免 D1 版本裡「trigger 引用不存在欄位」以及「同一動作被記錄兩次」的問題。

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price REAL NOT NULL,
  currency TEXT NOT NULL,
  cycle TEXT CHECK(cycle IN ('monthly', 'yearly')) NOT NULL,
  next_price REAL,
  effective_date DATETIME
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  apple_id TEXT,
  account_type TEXT DEFAULT 'apple' CHECK(account_type IN ('apple', 'google', 'other')),
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'HKD',
  service_id TEXT,
  start_date DATETIME,
  last_sync_date DATETIME,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('recharge', 'deduction', 'adjustment')) NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  memo TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  start_date DATETIME,
  group_name TEXT,
  telegram_group_id TEXT,
  service_account TEXT,
  next_price REAL,
  effective_date DATETIME,
  -- 記錄這筆訂閱最後一次被自動扣款的日期(YYYY-MM-DD)，讓 runSync 可以判斷「今天是否已經扣過」，
  -- 避免手動觸發 /api/sync 跟每日排程在同一天各扣一次、變成重複扣款。
  last_deducted_date TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_group ON subscriptions(telegram_group_id);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  subscription_id TEXT,
  email TEXT NOT NULL,
  payment_status BOOLEAN DEFAULT 0,
  memo TEXT,
  -- Telegram 繳費提醒 bot：成員綁定後才收得到催繳訊息。telegram_bind_token 是
  -- 一次性的綁定連結 token，成員點過 /start 連結成功綁定後就會被清空。
  telegram_chat_id TEXT,
  telegram_bind_token TEXT,
  telegram_bound_at TEXT,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS telegram_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  telegram_link TEXT,
  -- 開始收款日期（錨點）。跟 billing_cycle_type 一起決定往後的收款週期，
  -- 取代舊的「每月第 X 號」欄位——那個概念只適用月費，套用到半年/年費上會矛盾。
  start_date TEXT,
  billing_cycle_type TEXT DEFAULT 'biannual',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_cycles (
  id TEXT PRIMARY KEY,
  telegram_group_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  total_amount REAL,
  amount_per_member REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (telegram_group_id) REFERENCES telegram_groups(id)
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_group ON billing_cycles(telegram_group_id);

CREATE TABLE IF NOT EXISTS member_payments (
  id TEXT PRIMARY KEY,
  billing_cycle_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  member_id TEXT REFERENCES members(id),
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  paid INTEGER DEFAULT 0,
  paid_at TEXT,
  refunded_at TEXT,
  refund_amount REAL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Telegram bot 催繳用：payment_reported_at 是成員自己在 bot 裡按「我已繳費」的時間，
  -- 這只是「自己回報」，不會自動變成 paid=1——一定要管理員在後台確認過才算數，
  -- 避免任何人隨口按一下就讓系統認定已收款。last_reminded_at 用來讓催繳排程知道
  -- 上次已經提醒過，不用每天洗版式重複發送。
  payment_reported_at TEXT,
  last_reminded_at TEXT,
  FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_member_payments_cycle ON member_payments(billing_cycle_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_member ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_paid ON member_payments(paid);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  operator TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator);

CREATE TABLE IF NOT EXISTS balance_adjustments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  old_balance REAL NOT NULL,
  new_balance REAL NOT NULL,
  adjustment_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  operator TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_account ON balance_adjustments(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_created ON balance_adjustments(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_operator ON balance_adjustments(operator);
