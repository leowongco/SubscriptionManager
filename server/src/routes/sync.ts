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

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
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
  const deductedSubscriptionIds: string[] = [];

  const today = new Date();
  // 用來標記「這筆訂閱今天已經扣過了」，防止手動觸發 /api/sync 剛好跟每日排程
  // 落在同一天各跑一次，造成同一筆訂閱被扣兩次錢。
  const todayStr = today.toISOString().slice(0, 10);

  for (const sub of rawSubs) {
    if (!sub.base_price) continue;

    const startDate = sub.start_date ? new Date(sub.start_date) : today;
    // 扣款錨點日超過當月天數時（例如訂閱從 31 號開始，但當月只有 30 天甚至 28 天），
    // 改在當月最後一天扣款，而不是整個月都因為「找不到 31 號」而被跳過不扣。
    const effectiveDay = Math.min(startDate.getDate(), daysInMonth(today.getFullYear(), today.getMonth()));
    if (today.getDate() !== effectiveDay) continue;

    if (sub.last_deducted_date === todayStr) continue;

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
    deductedSubscriptionIds.push(sub.id);
  }

  const tx = db.transaction(() => {
    for (const h of historyInserts) {
      db.prepare('INSERT INTO history (id, account_id, type, amount, memo) VALUES (?, ?, ?, ?, ?)')
        .run(newId(), h.accountId, 'deduction', -h.deduction, `Auto-deduction: ${h.serviceName}`);
    }

    for (const subId of deductedSubscriptionIds) {
      db.prepare('UPDATE subscriptions SET last_deducted_date = ? WHERE id = ?').run(todayStr, subId);
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
