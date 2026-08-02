import { Router } from 'express';
import { db, newId } from '../db';
import { sendTelegramMessage } from '../lib/telegram';

export const syncRouter = Router();

interface AccountDeduction {
  apple_id: string;
  balance: number;
  deductionsTotal: number;
  servicesDeducted: string[];
}

export async function runSync(): Promise<{ processed: number; alerts_sent: number }> {
  // sub.* 已經包含這筆訂閱自己的 next_price/effective_date（每個帳號的調價時間可能不同，
  // 不從 services 表帶，避免同名欄位互相覆蓋）。
  const rawSubs = db.prepare(`
    SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle, a.apple_id, a.balance
    FROM subscriptions sub
    JOIN services s ON sub.service_id = s.id
    JOIN accounts a ON sub.account_id = a.id
  `).all() as any[];

  const lowBalanceAlerts: string[] = [];
  const accountsMap = new Map<string, AccountDeduction>();
  const historyInserts: { accountId: string; deduction: number; serviceName: string }[] = [];

  const today = new Date();

  for (const sub of rawSubs) {
    if (!sub.base_price) continue;

    const startDate = sub.start_date ? new Date(sub.start_date) : today;
    if (today.getDate() !== startDate.getDate()) continue;

    let currentPrice = sub.base_price;
    if (sub.next_price && sub.effective_date && new Date(sub.effective_date) <= today) {
      currentPrice = sub.next_price;
    }

    let deduction = currentPrice;
    if (sub.cycle === 'yearly') {
      deduction = currentPrice / 12;
    }

    if (!accountsMap.has(sub.account_id)) {
      accountsMap.set(sub.account_id, {
        apple_id: sub.apple_id,
        balance: sub.balance,
        deductionsTotal: 0,
        servicesDeducted: [],
      });
    }

    const accData = accountsMap.get(sub.account_id)!;
    accData.deductionsTotal += deduction;
    accData.servicesDeducted.push(sub.service_name);

    historyInserts.push({ accountId: sub.account_id, deduction, serviceName: sub.service_name });
  }

  const tx = db.transaction(() => {
    for (const h of historyInserts) {
      db.prepare('INSERT INTO history (id, account_id, type, amount, memo) VALUES (?, ?, ?, ?, ?)')
        .run(newId(), h.accountId, 'deduction', -h.deduction, `Auto-deduction: ${h.serviceName}`);
    }

    for (const [accountId, data] of accountsMap.entries()) {
      if (data.deductionsTotal <= 0) continue;

      const newBalance = data.balance - data.deductionsTotal;

      db.prepare('UPDATE accounts SET balance = ?, last_sync_date = ? WHERE id = ?')
        .run(newBalance, new Date().toISOString(), accountId);

      const roughMonthsLeft = newBalance / data.deductionsTotal;
      if (roughMonthsLeft < 2) {
        lowBalanceAlerts.push(
          `⚠️ Low Balance Alert\nApple ID: ${data.apple_id}\nDeducted Services: ${data.servicesDeducted.join(', ')}\nNew Balance: ${newBalance.toFixed(2)}\nEstimated Runaway: < 2 months`
        );
      }
    }
  });
  tx();

  if (lowBalanceAlerts.length > 0) {
    await sendTelegramMessage(lowBalanceAlerts.join('\n\n'));
  }

  return { processed: accountsMap.size, alerts_sent: lowBalanceAlerts.length };
}

// POST /api/sync - manual/ops trigger, protected by SYNC_SECRET if set.
// The daily automatic run is done in-process by node-cron (see src/cron.ts) and does not use this HTTP route.
syncRouter.post('/', async (req, res) => {
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${syncSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const result = await runSync();
    res.json({ message: 'Monthly deduction executed successfully', ...result });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});
