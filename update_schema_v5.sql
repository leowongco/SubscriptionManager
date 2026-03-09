-- Phase 12-b: Drop deprecated account_id column from members table
-- SQLite requires recreating the table to drop a column with a Foreign Key constraint

CREATE TABLE members_new (
  id TEXT PRIMARY KEY,
  subscription_id TEXT,
  email TEXT NOT NULL,
  payment_status BOOLEAN DEFAULT 0,
  memo TEXT
);

INSERT INTO members_new (id, subscription_id, email, payment_status, memo)
SELECT id, subscription_id, email, payment_status, memo FROM members;

DROP TABLE members;

ALTER TABLE members_new RENAME TO members;
