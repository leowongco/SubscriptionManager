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

export function newId(): string {
  return randomUUID();
}
