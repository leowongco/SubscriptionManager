import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit } from '../lib/audit';

export const billingCyclesRouter = Router();

billingCyclesRouter.get('/', (req, res) => {
  const telegramGroupId = req.query.telegram_group_id as string | undefined;
  const status = req.query.status as string | undefined;
  const cycleId = req.query.id as string | undefined;

  if (cycleId) {
    const cycle = db.prepare(
      'SELECT bc.*, tg.name as group_name, tg.billing_cycle_type FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?'
    ).get(cycleId) as any;

    if (!cycle) return res.status(404).json({ error: '帳單週期不存在' });

    const memberPayments = db.prepare(`
      SELECT mp.*, m.email as member_email, m.memo as member_memo,
             sub.id as subscription_id, s.name as service_name
      FROM member_payments mp
      JOIN members m ON mp.member_id = m.id
      JOIN subscriptions sub ON m.subscription_id = sub.id
      JOIN services s ON sub.service_id = s.id
      WHERE mp.billing_cycle_id = ?
      ORDER BY mp.created_at
    `).all(cycleId) as any[];

    const totalMembers = memberPayments.length;
    const paidMembers = memberPayments.filter((mp) => mp.paid).length;
    const unpaidMembers = totalMembers - paidMembers;
    const amountPerMember = cycle.amount_per_member || 0;
    const totalAmount = paidMembers * amountPerMember;

    return res.json({
      ...cycle,
      member_payments: memberPayments,
      stats: {
        total_members: totalMembers,
        paid_members: paidMembers,
        unpaid_members: unpaidMembers,
        total_amount: totalAmount,
        collection_rate: totalMembers > 0 ? ((paidMembers / totalMembers) * 100).toFixed(2) : 0,
      },
    });
  }

  let query = `
    SELECT bc.*, tg.name as group_name, tg.billing_cycle_type,
           COUNT(mp.id) as total_members,
           SUM(CASE WHEN mp.paid = 1 THEN 1 ELSE 0 END) as paid_members
    FROM billing_cycles bc
    JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
    LEFT JOIN member_payments mp ON bc.id = mp.billing_cycle_id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (telegramGroupId) {
    conditions.push('bc.telegram_group_id = ?');
    params.push(telegramGroupId);
  }
  if (status) {
    conditions.push('bc.status = ?');
    params.push(status);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' GROUP BY bc.id ORDER BY bc.created_at DESC';

  const results = db.prepare(query).all(...params) as any[];
  const enriched = results.map((cycle) => ({
    ...cycle,
    collection_rate: cycle.total_members > 0 ? ((cycle.paid_members / cycle.total_members) * 100).toFixed(2) : 0,
  }));

  res.json(enriched);
});

billingCyclesRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.telegram_group_id) return res.status(400).json({ error: '缺少必填字段: telegram_group_id' });
  if (!body.start_date) return res.status(400).json({ error: '缺少必填字段: start_date' });
  if (!body.end_date) return res.status(400).json({ error: '缺少必填字段: end_date' });
  if (!body.amount_per_member || body.amount_per_member <= 0) {
    return res.status(400).json({ error: '每人金額必須大於 0' });
  }

  const group = db.prepare('SELECT * FROM telegram_groups WHERE id = ?').get(body.telegram_group_id);
  if (!group) return res.status(404).json({ error: 'Telegram 群組不存在' });

  const id = body.id || newId();
  const now = new Date().toISOString();

  let memberCount = 0;

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO billing_cycles (id, telegram_group_id, start_date, end_date, amount_per_member, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, body.telegram_group_id, body.start_date, body.end_date, body.amount_per_member, body.status || 'active', now);

    const subscriptions = db.prepare('SELECT id, account_id FROM subscriptions WHERE telegram_group_id = ?').all(body.telegram_group_id) as any[];

    for (const sub of subscriptions) {
      const members = db.prepare('SELECT id FROM members WHERE subscription_id = ?').all(sub.id) as any[];
      for (const member of members) {
        db.prepare(
          'INSERT INTO member_payments (id, billing_cycle_id, member_id, account_id, amount, paid, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(newId(), id, member.id, sub.account_id, body.amount_per_member, 0, now);
        memberCount++;
      }
    }

    logAudit({
      actionType: 'CREATE',
      entityType: 'billing_cycle',
      entityId: id,
      newValue: {
        telegram_group_id: body.telegram_group_id,
        start_date: body.start_date,
        end_date: body.end_date,
        amount_per_member: body.amount_per_member,
        member_count: memberCount,
      },
    });
  });
  tx();

  const cycle = db.prepare(
    'SELECT bc.*, tg.name as group_name FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?'
  ).get(id) as any;

  res.status(201).json({ ...cycle, member_count: memberCount });
});

billingCyclesRouter.put('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: '缺少帳單週期 ID' });

  const body = req.body || {};
  const existingCycle = db.prepare('SELECT * FROM billing_cycles WHERE id = ?').get(id) as any;
  if (!existingCycle) return res.status(404).json({ error: '帳單週期不存在' });

  if (body.status && !['active', 'completed', 'refunded'].includes(body.status)) {
    return res.status(400).json({ error: '狀態必須是 active, completed 或 refunded' });
  }
  if (body.amount_per_member && body.amount_per_member <= 0) {
    return res.status(400).json({ error: '每人金額必須大於 0' });
  }

  db.prepare(`
    UPDATE billing_cycles
    SET start_date = ?, end_date = ?, amount_per_member = ?, status = ?
    WHERE id = ?
  `).run(
    body.start_date || existingCycle.start_date,
    body.end_date || existingCycle.end_date,
    body.amount_per_member || existingCycle.amount_per_member,
    body.status || existingCycle.status,
    id
  );

  logAudit({
    actionType: 'UPDATE',
    entityType: 'billing_cycle',
    entityId: id,
    newValue: body,
  });

  const cycle = db.prepare(
    'SELECT bc.*, tg.name as group_name FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?'
  ).get(id);
  res.json(cycle);
});

billingCyclesRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: '缺少帳單週期 ID' });

  const existingCycle = db.prepare('SELECT * FROM billing_cycles WHERE id = ?').get(id) as any;
  if (!existingCycle) return res.status(404).json({ error: '帳單週期不存在' });

  const paidPayments = db.prepare('SELECT * FROM member_payments WHERE billing_cycle_id = ? AND paid = 1').all(id) as any[];
  if (paidPayments.length > 0) {
    return res.status(400).json({ error: `無法刪除帳單週期，已有 ${paidPayments.length} 位成員付款。請先處理退款。` });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM member_payments WHERE billing_cycle_id = ?').run(id);
    db.prepare('DELETE FROM billing_cycles WHERE id = ?').run(id);

    logAudit({
      actionType: 'DELETE',
      entityType: 'billing_cycle',
      entityId: id,
      oldValue: {
        telegram_group_id: existingCycle.telegram_group_id,
        start_date: existingCycle.start_date,
        end_date: existingCycle.end_date,
      },
    });
  });
  tx();

  res.json({ success: true, message: '帳單週期已刪除' });
});
