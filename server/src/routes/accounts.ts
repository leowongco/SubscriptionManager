import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';
import { VALID_CURRENCIES } from '../lib/currency';
import { VALID_ACCOUNT_TYPES } from '../lib/accountType';

export const accountsRouter = Router();

accountsRouter.get('/', (_req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts').all() as any[];

  const subscriptions = db.prepare(`
    SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle,
           tg.name as telegram_group_name
    FROM subscriptions sub
    JOIN services s ON sub.service_id = s.id
    LEFT JOIN telegram_groups tg ON sub.telegram_group_id = tg.id
  `).all() as any[];

  const members = db.prepare('SELECT * FROM members').all() as any[];

  const memsBySub: Record<string, any[]> = {};
  for (const mem of members) {
    (memsBySub[mem.subscription_id] ??= []).push(mem);
  }

  const enrichedSubscriptions = subscriptions.map((sub) => ({
    ...sub,
    members: memsBySub[sub.id] || [],
  }));

  const subsByAccount: Record<string, any[]> = {};
  for (const sub of enrichedSubscriptions) {
    (subsByAccount[sub.account_id] ??= []).push(sub);
  }

  const enrichedAccounts = accounts.map((acc) => ({
    ...acc,
    subscriptions: subsByAccount[acc.id] || [],
  }));

  res.json(enrichedAccounts);
});

accountsRouter.post('/', (req, res) => {
  const body = req.body || {};
  const id = body.id || newId();

  if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
    return res.status(400).json({ error: 'Invalid currency code' });
  }

  if (body.account_type && !VALID_ACCOUNT_TYPES.includes(body.account_type)) {
    return res.status(400).json({ error: 'Invalid account_type' });
  }

  const accountType = body.account_type || 'apple';

  db.prepare(
    'INSERT INTO accounts (id, apple_id, account_type, balance, currency, last_sync_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, body.apple_id, accountType, body.balance || 0, body.currency || 'HKD', new Date().toISOString());

  logAudit({
    actionType: 'account_create',
    entityType: 'account',
    entityId: id,
    newValue: { apple_id: body.apple_id, account_type: accountType, balance: body.balance || 0 },
    reason: 'Account created',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.status(201).json({ id, message: 'Account created successfully' });
});

accountsRouter.put('/', (req, res) => {
  const body = req.body || {};
  const id = body.id;

  if (!id) return res.status(400).json({ error: 'Missing Account ID' });

  if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
    return res.status(400).json({ error: 'Invalid currency code' });
  }

  if (body.account_type && !VALID_ACCOUNT_TYPES.includes(body.account_type)) {
    return res.status(400).json({ error: 'Invalid account_type' });
  }

  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  const accountType = body.account_type || existing.account_type || 'apple';

  db.prepare(
    'UPDATE accounts SET apple_id = ?, account_type = ?, balance = ?, currency = ? WHERE id = ?'
  ).run(body.apple_id, accountType, body.balance, body.currency || 'HKD', id);

  logAudit({
    actionType: 'account_update',
    entityType: 'account',
    entityId: id,
    oldValue: { apple_id: existing.apple_id, account_type: existing.account_type, balance: existing.balance, currency: existing.currency },
    newValue: { apple_id: body.apple_id, account_type: accountType, balance: body.balance, currency: body.currency || 'HKD' },
    reason: 'Account updated',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Account updated successfully' });
});

accountsRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: 'Missing Account ID' });

  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: '帳號不存在' });

  const subscriptionCount = (db.prepare('SELECT COUNT(*) as c FROM subscriptions WHERE account_id = ?').get(id) as any).c;
  if (subscriptionCount > 0) {
    return res.status(400).json({ error: `無法刪除帳號，仍有 ${subscriptionCount} 筆訂閱關聯到此帳號，請先移除訂閱。` });
  }

  const tx = db.transaction(() => {
    // history、balance_adjustments 是這個帳號自己的歷史紀錄（不是獨立業務資料），
    // 帳號都要刪了就一併清掉，避免外鍵限制卡住刪除。
    db.prepare('DELETE FROM history WHERE account_id = ?').run(id);
    db.prepare('DELETE FROM balance_adjustments WHERE account_id = ?').run(id);
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  });
  tx();

  logAudit({
    actionType: 'account_delete',
    entityType: 'account',
    entityId: id,
    oldValue: { apple_id: existing.apple_id, balance: existing.balance },
    reason: 'Account deleted',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Account deleted successfully' });
});
