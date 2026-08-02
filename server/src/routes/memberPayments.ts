import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit } from '../lib/audit';

export const memberPaymentsRouter = Router();

memberPaymentsRouter.get('/', (req, res) => {
  const billingCycleId = req.query.billing_cycle_id as string | undefined;
  const accountId = req.query.account_id as string | undefined;
  const status = req.query.status as string | undefined; // paid, unpaid, refunded
  const paymentId = req.query.id as string | undefined;

  if (paymentId) {
    const payment = db.prepare(`
      SELECT mp.*, m.email as member_email, m.memo as member_memo,
             bc.start_date, bc.end_date, bc.amount_per_member, bc.status as cycle_status,
             tg.name as group_name,
             sub.id as subscription_id, s.name as service_name
      FROM member_payments mp
      JOIN members m ON mp.member_id = m.id
      JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
      JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
      JOIN subscriptions sub ON m.subscription_id = sub.id
      JOIN services s ON sub.service_id = s.id
      WHERE mp.id = ?
    `).get(paymentId);

    if (!payment) return res.status(404).json({ error: '付款記錄不存在' });
    return res.json(payment);
  }

  let query = `
    SELECT mp.*, m.email as member_email, m.memo as member_memo,
           bc.start_date, bc.end_date, bc.amount_per_member, bc.status as cycle_status,
           tg.name as group_name,
           sub.id as subscription_id, s.name as service_name, a.apple_id
    FROM member_payments mp
    JOIN members m ON mp.member_id = m.id
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
    JOIN subscriptions sub ON m.subscription_id = sub.id
    JOIN services s ON sub.service_id = s.id
    JOIN accounts a ON sub.account_id = a.id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (billingCycleId) {
    conditions.push('mp.billing_cycle_id = ?');
    params.push(billingCycleId);
  }
  if (accountId) {
    conditions.push('sub.account_id = ?');
    params.push(accountId);
  }
  if (status === 'paid') conditions.push('mp.paid = 1');
  else if (status === 'unpaid') conditions.push('mp.paid = 0');
  else if (status === 'refunded') conditions.push('mp.refund_amount IS NOT NULL');

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY mp.created_at DESC';

  const results = db.prepare(query).all(...params);
  res.json(results);
});

memberPaymentsRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.billing_cycle_id) return res.status(400).json({ error: '缺少必填字段: billing_cycle_id' });
  if (!body.member_id) return res.status(400).json({ error: '缺少必填字段: member_id' });

  const cycle = db.prepare('SELECT * FROM billing_cycles WHERE id = ?').get(body.billing_cycle_id) as any;
  if (!cycle) return res.status(404).json({ error: '帳單週期不存在' });

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(body.member_id) as any;
  if (!member) return res.status(404).json({ error: '成員不存在' });

  const existingPayment = db.prepare(
    'SELECT * FROM member_payments WHERE billing_cycle_id = ? AND member_id = ?'
  ).get(body.billing_cycle_id, body.member_id);
  if (existingPayment) return res.status(400).json({ error: '該成員在此帳單週期已有付款記錄' });

  const subscription = db.prepare('SELECT account_id FROM subscriptions WHERE id = ?').get(member.subscription_id) as any;
  if (!subscription) return res.status(404).json({ error: '找不到成員對應的訂閱' });

  const id = body.id || newId();
  const paid = body.paid || false;
  const paidAt = paid ? new Date().toISOString() : null;
  const amount = cycle.amount_per_member || 0;

  db.prepare(
    'INSERT INTO member_payments (id, billing_cycle_id, member_id, account_id, amount, paid, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.billing_cycle_id, body.member_id, subscription.account_id, amount, paid ? 1 : 0, paidAt, new Date().toISOString());

  logAudit({
    actionType: 'CREATE',
    entityType: 'member_payment',
    entityId: id,
    newValue: { billing_cycle_id: body.billing_cycle_id, member_id: body.member_id, paid },
  });

  const payment = db.prepare(`
    SELECT mp.*, m.email as member_email, m.memo as member_memo,
           bc.start_date, bc.end_date, bc.amount_per_member
    FROM member_payments mp
    JOIN members m ON mp.member_id = m.id
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    WHERE mp.id = ?
  `).get(id);

  res.status(201).json(payment);
});

memberPaymentsRouter.put('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: '缺少付款記錄 ID' });

  const body = req.body || {};
  const existingPayment = db.prepare(
    'SELECT mp.*, bc.status as cycle_status FROM member_payments mp JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id WHERE mp.id = ?'
  ).get(id) as any;
  if (!existingPayment) return res.status(404).json({ error: '付款記錄不存在' });

  if (existingPayment.cycle_status === 'completed') {
    return res.status(400).json({ error: '帳單週期已完成，無法修改付款狀態' });
  }

  const paid = body.paid !== undefined ? body.paid : existingPayment.paid;
  let paidAt = existingPayment.paid_at;

  if (body.paid === true && !existingPayment.paid) {
    paidAt = new Date().toISOString();
  } else if (body.paid === false) {
    paidAt = null;
  }

  db.prepare('UPDATE member_payments SET paid = ?, paid_at = ? WHERE id = ?').run(paid ? 1 : 0, paidAt, id);

  logAudit({
    actionType: 'UPDATE',
    entityType: 'member_payment',
    entityId: id,
    newValue: { paid, paid_at: paidAt },
  });

  const payment = db.prepare(`
    SELECT mp.*, m.email as member_email, m.memo as member_memo,
           bc.start_date, bc.end_date, bc.amount_per_member
    FROM member_payments mp
    JOIN members m ON mp.member_id = m.id
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    WHERE mp.id = ?
  `).get(id);

  res.json(payment);
});

// POST /api/member-payments/refund
memberPaymentsRouter.post('/refund', (req, res) => {
  const body = req.body || {};

  if (!body.member_payment_id) return res.status(400).json({ error: '缺少必填字段: member_payment_id' });
  if (!body.refund_amount || body.refund_amount <= 0) return res.status(400).json({ error: '退款金額必須大於 0' });

  const existingPayment = db.prepare(`
    SELECT mp.*, bc.amount_per_member, bc.status as cycle_status
    FROM member_payments mp
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    WHERE mp.id = ?
  `).get(body.member_payment_id) as any;

  if (!existingPayment) return res.status(404).json({ error: '付款記錄不存在' });
  if (!existingPayment.paid) return res.status(400).json({ error: '該成員尚未付款，無需退款' });

  const amountPerMember = existingPayment.amount_per_member;
  if (body.refund_amount > amountPerMember) {
    return res.status(400).json({ error: `退款金額不能超過每人金額 ${amountPerMember}` });
  }

  const refundAt = new Date().toISOString();

  db.prepare('UPDATE member_payments SET refund_amount = ?, refunded_at = ? WHERE id = ?')
    .run(body.refund_amount, refundAt, body.member_payment_id);

  logAudit({
    actionType: 'REFUND',
    entityType: 'member_payment',
    entityId: body.member_payment_id,
    newValue: { refund_amount: body.refund_amount, refund_at: refundAt },
  });

  const payment = db.prepare(`
    SELECT mp.*, m.email as member_email, m.memo as member_memo,
           bc.start_date, bc.end_date, bc.amount_per_member
    FROM member_payments mp
    JOIN members m ON mp.member_id = m.id
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    WHERE mp.id = ?
  `).get(body.member_payment_id);

  res.json(payment);
});
