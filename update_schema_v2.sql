-- 1. Create the new subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  start_date DATETIME,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- 2. Migrate existing data from accounts to subscriptions
INSERT INTO subscriptions (id, account_id, service_id, start_date)
SELECT lower(hex(randomblob(16))), id, service_id, start_date
FROM accounts
WHERE service_id IS NOT NULL;

-- Note: SQLite doesn't natively support DROP COLUMN. 
-- In production, we'd recreate the table. For this iterative local dev, 
-- we will just ignore the old columns in the queries.
