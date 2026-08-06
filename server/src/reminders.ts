import { db } from './db';
import { sendTelegramMessageTo } from './lib/telegram';

const DAY_MS = 24 * 60 * 60 * 1000;

function reminderIntervalMs(): number {
  const days = parseFloat(process.env.TELEGRAM_REMINDER_INTERVAL_DAYS || '3');
  return (Number.isFinite(days) && days > 0 ? days : 3) * DAY_MS;
}

// 找出所有「還沒繳費、成員已綁定 Telegram、帳單週期還在進行中」的紀錄，
// 依 last_reminded_at 節流（同一筆不會每天洗版式重複提醒），發訊息並附上
// 「我已繳費」按鈕讓成員回報——回報只會寫入 payment_reported_at，
// 真正標記為已繳費仍要管理員在後台確認。
export async function runReminderCheck(): Promise<{ checked: number; sent: number }> {
  const rows = db.prepare(`
    SELECT mp.id, mp.amount, mp.last_reminded_at,
           bc.end_date, tg.name as group_name,
           m.email as member_email, m.telegram_chat_id
    FROM member_payments mp
    JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
    JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
    JOIN members m ON mp.member_id = m.id
    WHERE mp.paid = 0
      AND mp.payment_reported_at IS NULL
      AND bc.status = 'active'
      AND m.telegram_chat_id IS NOT NULL
  `).all() as any[];

  const now = Date.now();
  const intervalMs = reminderIntervalMs();
  let sent = 0;

  for (const row of rows) {
    const lastRemindedMs = row.last_reminded_at ? new Date(row.last_reminded_at).getTime() : null;
    if (lastRemindedMs !== null && now - lastRemindedMs < intervalMs) continue;

    const text = [
      '💰 繳費提醒',
      '',
      `群組：${row.group_name}`,
      `金額：${row.amount}`,
      `截止日：${row.end_date}`,
      '',
      '請盡快完成繳費，繳費後可以按下方按鈕回報，管理員確認後會更新狀態。',
    ].join('\n');

    const ok = await sendTelegramMessageTo(row.telegram_chat_id, text, [
      { text: '✅ 我已繳費', callback_data: `report_paid:${row.id}` },
    ]);

    if (ok) {
      db.prepare('UPDATE member_payments SET last_reminded_at = ? WHERE id = ?')
        .run(new Date().toISOString(), row.id);
      sent++;
    }
  }

  return { checked: rows.length, sent };
}
