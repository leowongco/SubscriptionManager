import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';

export const accountBalanceRouter = Router();

// PATCH /api/accounts/:id/balance
accountBalanceRouter.patch('/:id/balance', (req, res) => {
  const accountId = req.params.id;
  const body = req.body || {};

  if (body.adjustment_amount === undefined || body.adjustment_amount === null) {
    return res.status(400).json({ error: 'Missing adjustment_amount' });
  }
  if (!body.reason) {
    return res.status(400).json({ error: 'Missing reason' });
  }
  if (!body.operator) {
    return res.status(400).json({ error: 'Missing operator' });
  }

  const adjustmentAmount = parseFloat(body.adjustment_amount);
  if (isNaN(adjustmentAmount)) {
    return res.status(400).json({ error: 'Invalid adjustment_amount' });
  }

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId) as any;
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const oldBalance = account.balance || 0;
  const newBalance = oldBalance + adjustmentAmount;
  const adjustmentId = 'adj_' + newId();
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);

    db.prepare(`
      INSERT INTO balance_adjustments
        (id, account_id, old_balance, new_balance, adjustment_amount, reason, operator, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adjustmentId, accountId, oldBalance, newBalance, adjustmentAmount, body.reason, body.operator, ipAddress, userAgent, now);

    logAudit({
      actionType: 'balance_adjustment',
      entityType: 'account',
      entityId: accountId,
      oldValue: { balance: oldBalance },
      newValue: { balance: newBalance },
      reason: body.reason,
      operator: body.operator,
      ipAddress,
      userAgent,
    });
  });
  tx();

  res.json({
    id: adjustmentId,
    account_id: accountId,
    old_balance: oldBalance,
    new_balance: newBalance,
    adjustment_amount: adjustmentAmount,
    reason: body.reason,
    operator: body.operator,
    created_at: now,
  });
});
