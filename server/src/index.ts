import './db'; // 確保啟動時先初始化資料庫 schema
import { createApp } from './app';
import { startCron } from './cron';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`SubscriptionManager server listening on port ${PORT}`);
  startCron();
});
