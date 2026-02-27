-- Phase 11: Generalize Account Grouping 
-- 1. Add the new group_name column
ALTER TABLE accounts ADD COLUMN group_name TEXT;

-- 2. Migrate existing google_account data to group_name
UPDATE accounts SET group_name = google_account;

-- Note: In a production environment, we might drop the google_account column by recreating the table. 
-- For now, the application will simply stop reading from or writing to `google_account`.
