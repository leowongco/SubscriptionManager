-- Migration: Add currency column to accounts table
-- Version: v9
-- Date: 2026-05-21
-- Description: 為蘋果帳號增加獨立的貨幣欄位，支援不同帳號使用不同貨幣

-- 為 accounts 表增加 currency 欄位
ALTER TABLE accounts ADD COLUMN currency TEXT DEFAULT 'HKD';

-- 建立索引以優化貨幣查詢
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);

-- 說明：
-- 支援的貨幣包括：
-- HKD - 港幣 (預設)
-- TRY - 土耳其幣
-- USD - 美元
-- TWD - 台幣
-- ARS - 阿根廷披索
-- 其他常用貨幣

-- 注意事項：
-- 1. 現有帳號會自動設定為 HKD
-- 2. 如需批量更新特定帳號的貨幣，可使用：
--    UPDATE accounts SET currency = 'TRY' WHERE apple_id LIKE '%特定條件%';
-- 3. 前端顯示時需根據貨幣類型顯示對應符號
