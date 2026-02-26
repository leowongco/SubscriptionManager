-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price REAL NOT NULL,
  currency TEXT NOT NULL,
  cycle TEXT CHECK(cycle IN ('monthly', 'yearly')) NOT NULL,
  next_price REAL,
  effective_date DATETIME
);

-- Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  apple_id TEXT,
  google_account TEXT,
  balance REAL DEFAULT 0,
  service_id TEXT,
  start_date DATETIME,
  last_sync_date DATETIME,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table: members
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  email TEXT NOT NULL,
  payment_status BOOLEAN DEFAULT 0,
  memo TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Table: history
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('recharge', 'deduction', 'adjustment')) NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  memo TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
