import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/', (req, res) => {
  const accountId = req.query.account_id as string | undefined;

  let query = `
    SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle,
           tg.name as telegram_group_name
    FROM subscriptions sub
    JOIN services s ON sub.service_id = s.id
    LEFT JOIN telegram_groups tg ON sub.telegram_group_id = tg.id
  `;
  const params: any[] = [];

  if (accountId) {
    query += ' WHERE sub.account_id = ?';
    params.push(accountId);
  }

  query += ' ORDER BY sub.start_date DESC';

  const results = db.prepare(query).all(...params);
  res.json(results);
});

subscriptionsRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.account_id) return res.status(400).json({ error: '缺少必填字段: account_id' });
  if (!body.service_id) return res.status(400).json({ error: '缺少必填字段: service_id' });

  const account = db.prepare('SELECT id, currency FROM accounts WHERE id = ?').get(body.account_id) as any;
  if (!account) return res.status(404).json({ error: '帳號不存在' });

  const service = db.prepare('SELECT id, currency, next_price, effective_date FROM services WHERE id = ?').get(body.service_id) as any;
  if (!service) return res.status(404).json({ error: '服務不存在' });

  const accountCurrency = account.currency || 'HKD';
  if (service.currency !== accountCurrency) {
    return res.status(400).json({
      error: `貨幣不符：此帳號地區為 ${accountCurrency}，但服務「${body.service_id}」計價貨幣為 ${service.currency}。訂閱扣款必須與帳號地區使用相同貨幣。`
    });
  }

  if (body.telegram_group_id) {
    const group = db.prepare('SELECT id FROM telegram_groups WHERE id = ?').get(body.telegram_group_id);
    if (!group) return res.status(404).json({ error: 'Telegram 群組不存在' });
  }

  const id = body.id || newId();
  const startDate = body.start_date || new Date().toISOString();
  const groupName = body.group_name || '無標題群組';
  const serviceAccount = body.service_account || null;
  const telegramGroupId = body.telegram_group_id || null;
  // 調漲後價格／生效日：不同帳號的訂閱可能各自有不同的調價時間（Apple 通常是按各帳號自己的續訂週期通知調價），
  // 所以這兩個欄位是每筆訂閱各自獨立的，不是服務層級共用。新增訂閱時預設繼承服務目前登記的調價計畫，之後可個別覆寫。
  const nextPrice = body.next_price !== undefined ? (body.next_price || null) : (service.next_price ?? null);
  const effectiveDate = body.effective_date !== undefined ? (body.effective_date || null) : (service.effective_date ?? null);

  db.prepare(
    'INSERT INTO subscriptions (id, account_id, service_id, start_date, group_name, telegram_group_id, service_account, next_price, effective_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.account_id, body.service_id, startDate, groupName, telegramGroupId, serviceAccount, nextPrice, effectiveDate);

  logAudit({
    actionType: 'subscription_add',
    entityType: 'subscription',
    entityId: id,
    newValue: { account_id: body.account_id, service_id: body.service_id, telegram_group_id: telegramGroupId, service_account: serviceAccount, next_price: nextPrice, effective_date: effectiveDate },
    reason: 'Subscription added',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.status(201).json({ id, message: 'Subscription added successfully' });
});

subscriptionsRouter.put('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing ID');

  const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Subscription not found' });

  const body = req.body || {};

  if (body.telegram_group_id) {
    const group = db.prepare('SELECT id FROM telegram_groups WHERE id = ?').get(body.telegram_group_id);
    if (!group) return res.status(404).json({ error: 'Telegram 群組不存在' });
  }

  const groupName = body.group_name ?? existing.group_name;
  const startDate = body.start_date ?? existing.start_date;
  const serviceAccount = body.service_account !== undefined ? (body.service_account || null) : existing.service_account;
  const telegramGroupId = body.telegram_group_id !== undefined ? (body.telegram_group_id || null) : existing.telegram_group_id;
  const nextPrice = body.next_price !== undefined ? (body.next_price || null) : existing.next_price;
  const effectiveDate = body.effective_date !== undefined ? (body.effective_date || null) : existing.effective_date;

  db.prepare(
    'UPDATE subscriptions SET group_name = ?, start_date = ?, telegram_group_id = ?, service_account = ?, next_price = ?, effective_date = ? WHERE id = ?'
  ).run(groupName, startDate, telegramGroupId, serviceAccount, nextPrice, effectiveDate, id);

  logAudit({
    actionType: 'subscription_update',
    entityType: 'subscription',
    entityId: id,
    oldValue: { group_name: existing.group_name, start_date: existing.start_date, telegram_group_id: existing.telegram_group_id, service_account: existing.service_account, next_price: existing.next_price, effective_date: existing.effective_date },
    newValue: { group_name: groupName, start_date: startDate, telegram_group_id: telegramGroupId, service_account: serviceAccount, next_price: nextPrice, effective_date: effectiveDate },
    reason: 'Subscription updated',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Subscription updated successfully' });
});

subscriptionsRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing ID');

  const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any;

  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM members WHERE subscription_id = ?').get(id) as any).c;
  if (memberCount > 0) {
    return res.status(400).json({ error: `無法刪除訂閱，仍有 ${memberCount} 位成員關聯到此訂閱，請先移除成員。` });
  }

  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);

  if (existing) {
    logAudit({
      actionType: 'subscription_remove',
      entityType: 'subscription',
      entityId: id,
      oldValue: { account_id: existing.account_id, service_id: existing.service_id },
      reason: 'Subscription removed',
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
    });
  }

  res.json({ message: 'Subscription removed successfully' });
});
