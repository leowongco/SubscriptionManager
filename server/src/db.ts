import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'subscription-manager.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf-8'));

// schema.sql 只用 CREATE TABLE IF NOT EXISTS，對已經部署過、資料表已存在的機器不會生效，
// 所以後續新增欄位要在這裡用 ALTER TABLE 補上，才能套用到已經在跑的正式環境資料庫。
function columnExists(table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return columns.some((c) => c.name === column);
}

function migrate() {
  if (!columnExists('telegram_groups', 'start_date')) {
    db.exec('ALTER TABLE telegram_groups ADD COLUMN start_date TEXT');
  }
  if (!columnExists('subscriptions', 'last_deducted_date')) {
    db.exec('ALTER TABLE subscriptions ADD COLUMN last_deducted_date TEXT');
  }
  if (!columnExists('members', 'telegram_chat_id')) {
    db.exec('ALTER TABLE members ADD COLUMN telegram_chat_id TEXT');
  }
  if (!columnExists('members', 'telegram_bind_token')) {
    db.exec('ALTER TABLE members ADD COLUMN telegram_bind_token TEXT');
  }
  if (!columnExists('members', 'telegram_bound_at')) {
    db.exec('ALTER TABLE members ADD COLUMN telegram_bound_at TEXT');
  }
  if (!columnExists('member_payments', 'payment_reported_at')) {
    db.exec('ALTER TABLE member_payments ADD COLUMN payment_reported_at TEXT');
  }
  if (!columnExists('member_payments', 'last_reminded_at')) {
    db.exec('ALTER TABLE member_payments ADD COLUMN last_reminded_at TEXT');
  }
}
migrate();

export function newId(): string {
  return randomUUID();
}
