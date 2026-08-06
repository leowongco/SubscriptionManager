import { db } from '../db';
import { sendTelegramMessageTo, answerCallbackQuery, getTelegramUpdates } from './telegram';

let pollingOffset = 0;
let polling = false;

// 成員在 bot 裡按「/start <token>」把自己的 Telegram 帳號綁到某個成員紀錄上。
// token 是一次性的，綁定成功後立刻清空，避免連結外流被別人拿去綁走。
async function handleStart(chatId: string, token: string): Promise<void> {
  const member = db.prepare('SELECT * FROM members WHERE telegram_bind_token = ?').get(token) as any;
  if (!member) {
    await sendTelegramMessageTo(chatId, '這個綁定連結已失效，請跟管理員索取新的連結。');
    return;
  }

  db.prepare(
    'UPDATE members SET telegram_chat_id = ?, telegram_bind_token = NULL, telegram_bound_at = ? WHERE id = ?'
  ).run(chatId, new Date().toISOString(), member.id);

  await sendTelegramMessageTo(chatId, `✅ 綁定成功！之後「${member.email}」的繳費提醒會發到這裡。`);
}

async function handleMessage(message: any): Promise<void> {
  const text: string = message.text || '';
  const chatId = message.chat?.id !== undefined ? String(message.chat.id) : null;
  if (!chatId) return;

  const startMatch = text.match(/^\/start(?:@\S+)?(?:\s+(\S+))?/);
  if (startMatch) {
    const token = startMatch[1];
    if (!token) {
      await sendTelegramMessageTo(chatId, '請使用管理員提供的專屬連結進行綁定，不要直接輸入 /start。');
      return;
    }
    await handleStart(chatId, token);
  }
}

// 成員在繳費提醒訊息裡按「我已繳費」——這只是「自己回報」，不會直接標記為已繳費，
// 一定要管理員在後台按下「確認收款」才算數，避免有人隨口一按就讓系統認定已收款。
async function handleCallbackQuery(callbackQuery: any): Promise<void> {
  const data: string = callbackQuery.data || '';
  const chatId = callbackQuery.message?.chat?.id !== undefined ? String(callbackQuery.message.chat.id) : null;

  const reportMatch = data.match(/^report_paid:(.+)$/);
  if (!reportMatch) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const paymentId = reportMatch[1];
  const payment = db.prepare('SELECT * FROM member_payments WHERE id = ?').get(paymentId) as any;

  if (!payment) {
    await answerCallbackQuery(callbackQuery.id, '找不到這筆繳費紀錄');
    return;
  }
  if (payment.paid) {
    await answerCallbackQuery(callbackQuery.id, '這筆款項已經確認收款了');
    return;
  }

  db.prepare('UPDATE member_payments SET payment_reported_at = ? WHERE id = ?')
    .run(new Date().toISOString(), paymentId);

  await answerCallbackQuery(callbackQuery.id, '已收到，等待管理員確認');
  if (chatId) {
    await sendTelegramMessageTo(chatId, '已收到你的回報，管理員確認後會更新繳費狀態，謝謝！');
  }
}

export async function handleTelegramUpdate(update: any): Promise<void> {
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

// 用長輪詢（long polling）而不是 webhook：不用另外開一個對外公開、要驗證來源的
// HTTP 端點，單一 VPS/單一實例部署下最簡單也最不容易被誤用。
export async function startTelegramBotPolling(): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('[telegram-bot] TELEGRAM_BOT_TOKEN 未設定，不啟動 bot');
    return;
  }
  if (polling) return;
  polling = true;

  console.log('[telegram-bot] 開始長輪詢 Telegram getUpdates');

  while (polling) {
    try {
      const updates = await getTelegramUpdates(pollingOffset, 30);
      for (const update of updates) {
        pollingOffset = update.update_id + 1;
        try {
          await handleTelegramUpdate(update);
        } catch (error) {
          console.error('[telegram-bot] 處理 update 失敗', error);
        }
      }
    } catch (error) {
      console.error('[telegram-bot] getUpdates 失敗，5 秒後重試', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export function stopTelegramBotPolling(): void {
  polling = false;
}
