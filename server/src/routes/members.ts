import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';
import { getBotUsername } from '../lib/telegram';

export const membersRouter = Router();

membersRouter.get('/', (req, res) => {
  const subscriptionId = req.query.subscription_id as string | undefined;

  let query = 'SELECT * FROM members';
  const params: any[] = [];
  if (subscriptionId) {
    query += ' WHERE subscription_id = ?';
    params.push(subscriptionId);
  }

  const results = db.prepare(query).all(...params);
  res.json(results);
});

// 新成員加入時，把這筆訂閱底下「還在收款中」的帳單週期也一併補上一筆待繳紀錄，
// 不然這個人不會出現在週期已經建立過的繳費清單/催繳名單裡。
function backfillMemberPayments(memberId: string, subscriptionId: string) {
  const subscription = db.prepare('SELECT telegram_group_id FROM subscriptions WHERE id = ?').get(subscriptionId) as any;
  if (!subscription?.telegram_group_id) return;

  const activeCycles = db.prepare(
    "SELECT id, amount_per_member FROM billing_cycles WHERE telegram_group_id = ? AND status = 'active'"
  ).all(subscription.telegram_group_id) as any[];

  const now = new Date().toISOString();
  for (const cycle of activeCycles) {
    db.prepare(
      'INSERT INTO member_payments (id, billing_cycle_id, member_id, account_id, amount, paid, created_at) ' +
      'SELECT ?, ?, ?, sub.account_id, ?, 0, ? FROM subscriptions sub WHERE sub.id = ?'
    ).run(newId(), cycle.id, memberId, cycle.amount_per_member, now, subscriptionId);
  }
}

membersRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.subscription_id) return res.status(400).json({ error: '缺少必填字段: subscription_id' });
  if (!body.email) return res.status(400).json({ error: '缺少必填字段: email' });

  const subscription = db.prepare('SELECT id FROM subscriptions WHERE id = ?').get(body.subscription_id);
  if (!subscription) return res.status(404).json({ error: '找不到對應的訂閱' });

  const id = body.id || newId();

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO members (id, subscription_id, email, payment_status, memo) VALUES (?, ?, ?, ?, ?)'
    ).run(id, body.subscription_id, body.email, body.payment_status ? 1 : 0, body.memo || null);

    backfillMemberPayments(id, body.subscription_id);
  });
  tx();

  logAudit({
    actionType: 'member_create',
    entityType: 'member',
    entityId: id,
    newValue: { subscription_id: body.subscription_id, email: body.email },
    reason: 'Member added',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.status(201).json({ id, message: 'Member created successfully' });
});

// POST /api/members/:id/telegram-bind-link — 產生一次性綁定連結，管理員複製後傳給成員本人，
// 成員在 Telegram 點開連結、按 Start，bot 就會把他的 chat_id 綁到這筆成員紀錄上。
membersRouter.post('/:id/telegram-bind-link', async (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(400).json({ error: '伺服器未設定 TELEGRAM_BOT_TOKEN，無法產生綁定連結' });
  }

  const username = await getBotUsername();
  if (!username) {
    return res.status(502).json({ error: '無法連上 Telegram，請確認 TELEGRAM_BOT_TOKEN 是否正確' });
  }

  const token = newId();
  db.prepare('UPDATE members SET telegram_bind_token = ? WHERE id = ?').run(token, id);

  res.json({ bind_url: `https://t.me/${username}?start=${token}` });
});

// DELETE /api/members/:id/telegram-bind — 解除綁定（例如成員換了 Telegram 帳號）。
membersRouter.delete('/:id/telegram-bind', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  db.prepare(
    'UPDATE members SET telegram_chat_id = NULL, telegram_bind_token = NULL, telegram_bound_at = NULL WHERE id = ?'
  ).run(id);

  logAudit({
    actionType: 'member_telegram_unbind',
    entityType: 'member',
    entityId: id,
    reason: 'Telegram binding removed',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Telegram binding removed' });
});

membersRouter.put('/', (req, res) => {
  const body = req.body || {};
  const id = body.id;
  if (!id) return res.status(400).send('Missing Member ID');

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  if (!body.email) return res.status(400).json({ error: '缺少必填字段: email' });

  db.prepare(
    'UPDATE members SET subscription_id = ?, email = ?, payment_status = ?, memo = ? WHERE id = ?'
  ).run(body.subscription_id, body.email, body.payment_status ? 1 : 0, body.memo || null, id);

  logAudit({
    actionType: 'member_update',
    entityType: 'member',
    entityId: id,
    oldValue: { subscription_id: existing.subscription_id, email: existing.email, payment_status: existing.payment_status },
    newValue: { subscription_id: body.subscription_id, email: body.email, payment_status: body.payment_status ? 1 : 0 },
    reason: 'Member updated',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Member updated successfully' });
});

membersRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing Member ID');

  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Member not found' });

  const paymentCount = (db.prepare('SELECT COUNT(*) as c FROM member_payments WHERE member_id = ?').get(id) as any).c;
  if (paymentCount > 0) {
    return res.status(400).json({ error: `無法刪除成員，仍有 ${paymentCount} 筆繳費紀錄，請先在收款週期裡處理。` });
  }

  db.prepare('DELETE FROM members WHERE id = ?').run(id);

  logAudit({
    actionType: 'member_delete',
    entityType: 'member',
    entityId: id,
    oldValue: { subscription_id: existing.subscription_id, email: existing.email },
    reason: 'Member deleted',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Member deleted successfully' });
});
