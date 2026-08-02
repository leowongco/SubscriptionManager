import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';

export const balanceAdjustmentsRouter = Router();

balanceAdjustmentsRouter.post('/', (req, res) => {
  const body = req.body || {};

  if (!body.account_id) return res.status(400).json({ error: 'Missing account_id' });
  if (body.adjustment_amount === undefined || body.adjustment_amount === null) {
    return res.status(400).json({ error: 'Missing adjustment_amount' });
  }
  if (!body.reason) return res.status(400).json({ error: 'Missing reason' });
  if (!body.operator) return res.status(400).json({ error: 'Missing operator' });

  const adjustmentAmount = parseFloat(body.adjustment_amount);
  if (isNaN(adjustmentAmount)) return res.status(400).json({ error: 'Invalid adjustment_amount' });

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(body.account_id) as any;
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const oldBalance = account.balance || 0;
  const newBalance = oldBalance + adjustmentAmount;
  const adjustmentId = 'adj_' + newId();
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, body.account_id);

    db.prepare(`
      INSERT INTO balance_adjustments
        (id, account_id, old_balance, new_balance, adjustment_amount, reason, operator, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adjustmentId, body.account_id, oldBalance, newBalance, adjustmentAmount, body.reason, body.operator, ipAddress, userAgent, now);

    logAudit({
      actionType: 'balance_adjustment',
      entityType: 'account',
      entityId: body.account_id,
      oldValue: { balance: oldBalance },
      newValue: { balance: newBalance },
      reason: body.reason,
      operator: body.operator,
      ipAddress,
      userAgent,
    });
  });
  tx();

  res.status(201).json({
    id: adjustmentId,
    account_id: body.account_id,
    old_balance: oldBalance,
    new_balance: newBalance,
    adjustment_amount: adjustmentAmount,
    reason: body.reason,
    operator: body.operator,
    created_at: now,
  });
});

balanceAdjustmentsRouter.get('/', (req, res) => {
  const accountId = req.query.account_id as string | undefined;
  const operator = req.query.operator as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const limit = parseInt((req.query.limit as string) || '100');
  const offset = parseInt((req.query.offset as string) || '0');

  let query = `
    SELECT ba.*, a.apple_id
    FROM balance_adjustments ba
    LEFT JOIN accounts a ON ba.account_id = a.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (accountId) { query += ' AND ba.account_id = ?'; params.push(accountId); }
  if (operator) { query += ' AND ba.operator = ?'; params.push(operator); }
  if (startDate) { query += ' AND ba.created_at >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND ba.created_at <= ?'; params.push(endDate); }

  query += ' ORDER BY ba.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const results = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM balance_adjustments WHERE 1=1';
  const countParams: any[] = [];
  if (accountId) { countQuery += ' AND account_id = ?'; countParams.push(accountId); }
  if (operator) { countQuery += ' AND operator = ?'; countParams.push(operator); }
  if (startDate) { countQuery += ' AND created_at >= ?'; countParams.push(startDate); }
  if (endDate) { countQuery += ' AND created_at <= ?'; countParams.push(endDate); }

  const countResult = db.prepare(countQuery).get(...countParams) as { total: number };
  const totalCount = countResult?.total || 0;

  res.json({
    data: results,
    pagination: { total: totalCount, limit, offset, has_more: totalCount > offset + limit },
  });
});
