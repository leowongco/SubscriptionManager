import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit } from '../lib/audit';

export const telegramGroupsRouter = Router();

telegramGroupsRouter.get('/', (req, res) => {
  const billingDay = req.query.billing_day as string | undefined;
  const billingCycleType = req.query.billing_cycle_type as string | undefined;
  const groupId = req.query.id as string | undefined;

  if (groupId) {
    const group = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(groupId) as any;
    if (!group) {
      return res.status(404).json({ error: '群組不存在' });
    }

    const subscriptions = db.prepare(`
      SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle,
             a.apple_id, a.balance as account_balance
      FROM subscriptions sub
      JOIN services s ON sub.service_id = s.id
      JOIN accounts a ON sub.account_id = a.id
      WHERE sub.telegram_group_id = ?
    `).all(groupId) as any[];

    const enrichedSubscriptions = subscriptions.map((sub) => {
      const members = db.prepare('SELECT * FROM members WHERE subscription_id = ?').all(sub.id);
      return { ...sub, members };
    });

    const accountCount = subscriptions.length;

    const billingCycles = db.prepare(
      'SELECT * FROM billing_cycles WHERE telegram_group_id = ? ORDER BY created_at DESC'
    ).all(groupId) as any[];

    const enrichedCycles = billingCycles.map((cycle) => {
      const memberPayments = db.prepare('SELECT * FROM member_payments WHERE billing_cycle_id = ?').all(cycle.id);
      return { ...cycle, member_payments: memberPayments };
    });

    return res.json({
      ...group,
      account_count: accountCount,
      subscriptions: enrichedSubscriptions,
      billing_cycles: enrichedCycles,
    });
  }

  let query = 'SELECT tg.*, COUNT(DISTINCT sub.account_id) as account_count FROM telegram_groups tg LEFT JOIN subscriptions sub ON tg.id = sub.telegram_group_id';
  const conditions: string[] = [];
  const params: any[] = [];

  if (billingDay) {
    conditions.push('tg.billing_day = ?');
    params.push(parseInt(billingDay));
  }
  if (billingCycleType) {
    conditions.push('tg.billing_cycle_type = ?');
    params.push(billingCycleType);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' GROUP BY tg.id ORDER BY tg.created_at DESC';

  const results = db.prepare(query).all(...params);
  res.json(results);
});

telegramGroupsRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.name) {
    return res.status(400).json({ error: '缺少必填字段: name' });
  }
  if (!body.billing_day || body.billing_day < 1 || body.billing_day > 31) {
    return res.status(400).json({ error: '扣費日必須在 1-31 之間' });
  }
  if (!body.billing_cycle_type || !['monthly', 'biannually', 'yearly'].includes(body.billing_cycle_type)) {
    return res.status(400).json({ error: '收費週期必須是 monthly, biannually 或 yearly' });
  }

  const id = body.id || newId();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO telegram_groups (id, name, telegram_link, billing_day, billing_cycle_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.name, body.telegram_link || null, body.billing_day, body.billing_cycle_type, body.notes || null, now);

  logAudit({
    actionType: 'CREATE',
    entityType: 'telegram_group',
    entityId: id,
    newValue: { name: body.name, billing_day: body.billing_day, billing_cycle_type: body.billing_cycle_type },
  });

  const group = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(id);
  res.status(201).json(group);
});

telegramGroupsRouter.put('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: '缺少群組 ID' });

  const body = req.body || {};
  const existingGroup = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(id) as any;
  if (!existingGroup) return res.status(404).json({ error: '群組不存在' });

  if (body.billing_day && (body.billing_day < 1 || body.billing_day > 31)) {
    return res.status(400).json({ error: '扣費日必須在 1-31 之間' });
  }
  if (body.billing_cycle_type && !['monthly', 'biannually', 'yearly'].includes(body.billing_cycle_type)) {
    return res.status(400).json({ error: '收費週期必須是 monthly, biannually 或 yearly' });
  }

  db.prepare(`
    UPDATE telegram_groups
    SET name = ?, telegram_link = ?, billing_day = ?, billing_cycle_type = ?, notes = ?
    WHERE id = ?
  `).run(
    body.name || existingGroup.name,
    body.telegram_link || existingGroup.telegram_link,
    body.billing_day || existingGroup.billing_day,
    body.billing_cycle_type || existingGroup.billing_cycle_type,
    body.notes || existingGroup.notes,
    id
  );

  logAudit({
    actionType: 'UPDATE',
    entityType: 'telegram_group',
    entityId: id,
    newValue: body,
  });

  const group = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(id);
  res.json(group);
});

telegramGroupsRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: '缺少群組 ID' });

  const existingGroup = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(id) as any;
  if (!existingGroup) return res.status(404).json({ error: '群組不存在' });

  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE telegram_group_id = ?').all(id) as any[];
  if (subscriptions.length > 0) {
    return res.status(400).json({ error: `無法刪除群組，仍有 ${subscriptions.length} 個訂閱關聯到此群組。請先解除關聯。` });
  }

  const billingCycles = db.prepare('SELECT * FROM billing_cycles WHERE telegram_group_id = ?').all(id) as any[];
  if (billingCycles.length > 0) {
    return res.status(400).json({ error: `無法刪除群組，仍有 ${billingCycles.length} 個收費週期關聯到此群組。請先刪除收費週期。` });
  }

  db.prepare('DELETE FROM telegram_groups WHERE id = ?').run(id);

  logAudit({
    actionType: 'DELETE',
    entityType: 'telegram_group',
    entityId: id,
    oldValue: { name: existingGroup.name },
  });

  res.json({ success: true, message: '群組已刪除' });
});
