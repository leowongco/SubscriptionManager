import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit } from '../lib/audit';

export const rechargeRouter = Router();

interface RechargeItem {
  account_id: string;
  amount: number;
  memo?: string;
  operator?: string;
  reason?: string;
}

interface RechargeResult {
  account_id: string;
  apple_id: string | null;
  success: boolean;
  message?: string;
  new_balance?: number;
}

function logBalanceAdjustment(
  accountId: string,
  oldBalance: number,
  newBalance: number,
  adjustmentAmount: number,
  reason: string,
  operator: string
): void {
  db.prepare(`
    INSERT INTO balance_adjustments
      (id, account_id, old_balance, new_balance, adjustment_amount, reason, operator, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('adj_' + newId(), accountId, oldBalance, newBalance, adjustmentAmount, reason, operator, new Date().toISOString());
}

rechargeRouter.post('/', (req, res) => {
  const body = req.body;

  let rechargeItems: RechargeItem[] = [];
  let operator = 'system';

  if (Array.isArray(body)) {
    rechargeItems = body.map((item) => ({
      account_id: item.account_id,
      amount: item.amount,
      memo: item.gift_card || item.memo,
      operator: item.operator || 'system',
      reason: item.reason || 'Batch recharge',
    }));
  } else if (body?.account_ids && Array.isArray(body.account_ids)) {
    const { account_ids, amount, reason, operator: op, gift_card } = body;
    operator = op || 'system';
    rechargeItems = account_ids.map((accountId: string) => ({
      account_id: accountId,
      amount,
      memo: gift_card,
      operator,
      reason: reason || 'Batch recharge',
    }));
  } else {
    return res.status(400).send('Invalid payload: expected an array or batch recharge object');
  }

  if (rechargeItems.length === 0) {
    return res.status(400).send('No recharge items provided');
  }

  // 一批加值裡的帳號必須全部屬於同一個地區（貨幣），否則同一個 amount 套用到不同貨幣的帳號上會產生錯誤的金額。
  const accountIds = [...new Set(rechargeItems.map((item) => item.account_id).filter(Boolean))];
  if (accountIds.length > 0) {
    const placeholders = accountIds.map(() => '?').join(',');
    const accountCurrencies = db.prepare(
      `SELECT id, apple_id, currency FROM accounts WHERE id IN (${placeholders})`
    ).all(...accountIds) as any[];

    const distinctCurrencies = new Set(accountCurrencies.map((a) => a.currency || 'HKD'));
    if (distinctCurrencies.size > 1) {
      const breakdown = accountCurrencies.map((a) => `${a.apple_id || a.id}(${a.currency || 'HKD'})`).join(', ');
      return res.status(400).json({
        error: `批次加值裡混雜了不同地區的帳號，無法用同一個金額加值：${breakdown}。請依帳號地區分開加值。`
      });
    }
  }

  const results: RechargeResult[] = [];

  for (const item of rechargeItems) {
    const { account_id, amount, memo, reason, operator: itemOperator } = item;
    const effectiveOperator = itemOperator || operator;

    if (!account_id || !amount || amount <= 0) {
      const accountInfo = db.prepare('SELECT apple_id FROM accounts WHERE id = ?').get(account_id) as any;
      results.push({
        account_id,
        apple_id: accountInfo?.apple_id ?? null,
        success: false,
        message: 'Invalid account_id or amount',
      });
      continue;
    }

    try {
      const account = db.prepare('SELECT apple_id, balance FROM accounts WHERE id = ?').get(account_id) as any;

      if (!account) {
        results.push({ account_id, apple_id: null, success: false, message: 'Account not found' });
        continue;
      }

      const oldBalance = account.balance as number;
      const newBalance = oldBalance + amount;
      const historyId = newId();
      const finalReason = reason || memo || 'Batch recharge';

      const tx = db.transaction(() => {
        db.prepare('UPDATE accounts SET balance = ?, last_sync_date = ? WHERE id = ?')
          .run(newBalance, new Date().toISOString(), account_id);

        db.prepare('INSERT INTO history (id, account_id, type, amount, created_at, memo) VALUES (?, ?, ?, ?, ?, ?)')
          .run(historyId, account_id, 'recharge', amount, new Date().toISOString(), memo || reason);

        logAudit({
          actionType: 'RECHARGE',
          entityType: 'account',
          entityId: account_id,
          newValue: { old_balance: oldBalance, new_balance: newBalance, amount, reason: finalReason, history_id: historyId },
          operator: effectiveOperator,
        });

        logBalanceAdjustment(account_id, oldBalance, newBalance, amount, finalReason, effectiveOperator);
      });
      tx();

      results.push({ account_id, apple_id: account.apple_id ?? null, success: true, new_balance: newBalance });
    } catch (error: any) {
      const accountInfo = db.prepare('SELECT apple_id FROM accounts WHERE id = ?').get(account_id) as any;
      results.push({
        account_id,
        apple_id: accountInfo?.apple_id ?? null,
        success: false,
        message: error.message || 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  res.status(201).json({
    message: 'Batch recharge completed',
    processed: results.length,
    success: successCount,
    failed: failedCount,
    results,
  });
});
