import './db'; // 確保啟動時先初始化資料庫 schema
import { createApp } from './app';
import { startCron } from './cron';
import { startTelegramBotPolling } from './lib/telegramBot';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`SubscriptionManager server listening on port ${PORT}`);
  startCron();
  // 長輪詢跑在背景，不 await——啟動失敗（例如網路不通）不該讓整個 server 掛掉。
  startTelegramBotPolling().catch((error) => {
    console.error('[telegram-bot] 啟動失敗', error);
  });
});
