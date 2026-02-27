-- Phase 12: Member-to-Subscription Architecture

-- 1. Add group_name column to the subscriptions table
ALTER TABLE subscriptions ADD COLUMN group_name TEXT;

-- 2. Migrate existing group_name from accounts to subscriptions
-- We take the group_name from the parent account and assign it to its subscriptions as an initial fallback
UPDATE subscriptions 
SET group_name = (SELECT group_name FROM accounts WHERE accounts.id = subscriptions.account_id)
WHERE group_name IS NULL;

-- 3. Add subscription_id column to the members table
ALTER TABLE members ADD COLUMN subscription_id TEXT;

-- 4. Migrate existing members to their FIRST corresponding subscription under the same account.
-- (If there are multiple subscriptions per account, this is a best-effort migration assigning them to the first one)
UPDATE members
SET subscription_id = (
    SELECT id 
    FROM subscriptions 
    WHERE subscriptions.account_id = members.account_id 
    LIMIT 1
)
WHERE subscription_id IS NULL;

-- IMPORTANT: In the application logic moving forward, `group_name` on `accounts` and `account_id` on `members` are DEPRECATED.
-- They will be ignored by the backend APIs, which will solely rely on `subscriptions.group_name` and `members.subscription_id`.
