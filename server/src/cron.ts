import cron from 'node-cron';
import { runSync } from './routes/sync';

// 每天 00:10 UTC 執行一次自動扣款檢查。
// sync 邏輯是逐筆比對「今天是不是這筆訂閱自己的扣款週年日」，所以必須每天跑，
// 不能像文件裡舊的建議那樣只在每月 1 號跑一次（那樣只有 1 號訂閱的帳號會被扣款）。
// 時間可透過 SYNC_CRON_SCHEDULE 環境變數覆蓋（cron 語法，容器內時區固定為 UTC）。
const SCHEDULE = process.env.SYNC_CRON_SCHEDULE || '10 0 * * *';

export function startCron(): void {
  if (process.env.SYNC_CRON_DISABLED === 'true') {
    console.log('[cron] SYNC_CRON_DISABLED=true，跳過排程註冊');
    return;
  }

  cron.schedule(SCHEDULE, async () => {
    console.log(`[cron] ${new Date().toISOString()} 開始執行自動扣款`);
    try {
      const result = await runSync();
      console.log(`[cron] 完成：processed=${result.processed} alerts_sent=${result.alerts_sent}`);
    } catch (error) {
      console.error('[cron] 自動扣款執行失敗', error);
    }
  }, { timezone: 'UTC' });

  console.log(`[cron] 已註冊自動扣款排程："${SCHEDULE}" (UTC)`);
}
