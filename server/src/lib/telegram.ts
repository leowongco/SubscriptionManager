export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

async function telegramApiRequest<T = any>(method: string, params: Record<string, unknown>): Promise<T | null> {
  const botToken = getBotToken();
  if (!botToken) return null;

  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`Telegram ${method} failed: ${res.status} ${body}`);
    return null;
  }

  const data = await res.json();
  return data.result ?? null;
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;
  await telegramApiRequest('sendMessage', { chat_id: chatId, text });
}

// 私訊某個成員（繳費提醒、綁定確認用），可選附一排 inline keyboard 按鈕。
export async function sendTelegramMessageTo(
  chatId: string,
  text: string,
  buttons?: InlineKeyboardButton[]
): Promise<boolean> {
  const result = await telegramApiRequest('sendMessage', {
    chat_id: chatId,
    text,
    ...(buttons && buttons.length > 0
      ? { reply_markup: { inline_keyboard: [buttons] } }
      : {}),
  });
  return result !== null;
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await telegramApiRequest('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

export async function getTelegramUpdates(offset: number, timeoutSeconds: number): Promise<any[]> {
  const result = await telegramApiRequest<any[]>('getUpdates', {
    offset,
    timeout: timeoutSeconds,
    allowed_updates: ['message', 'callback_query'],
  });
  return result ?? [];
}

let cachedBotUsername: string | null | undefined;

// 產生綁定連結（https://t.me/<username>?start=<token>）需要知道 bot 的 username，
// 呼叫一次 getMe 就快取起來，不用每次產生連結都打一次 Telegram API。
export async function getBotUsername(): Promise<string | null> {
  if (cachedBotUsername !== undefined) return cachedBotUsername;
  const me = await telegramApiRequest<{ username?: string }>('getMe', {});
  cachedBotUsername = me?.username ?? null;
  return cachedBotUsername;
}
