import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { sessionOrBasicAuth } from './middleware/auth';
import { authRouter } from './routes/auth';
import { accountsRouter } from './routes/accounts';
import { accountBalanceRouter } from './routes/accountBalance';
import { servicesRouter } from './routes/services';
import { subscriptionsRouter } from './routes/subscriptions';
import { membersRouter } from './routes/members';
import { historyRouter } from './routes/history';
import { rechargeRouter } from './routes/recharge';
import { telegramGroupsRouter } from './routes/telegramGroups';
import { billingCyclesRouter } from './routes/billingCycles';
import { memberPaymentsRouter } from './routes/memberPayments';
import { balanceAdjustmentsRouter } from './routes/balanceAdjustments';
import { auditRouter } from './routes/audit';
import { syncRouter } from './routes/sync';

export function createApp() {
  const app = express();

  // trust proxy 設 true 等於信任「任何」用戶端自己填的 X-Forwarded-For，
  // 等於讓人可以直接偽造來源 IP 繞過下面的登入失敗限流。這裡只信任最近一層
  // （VPS 上常見的反向代理，如 1Panel 的 Nginx），沒有反代直接連時則以實際
  // TCP 連線位址為準，不會被用戶端自己塞的標頭騙過。
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (!process.env.APP_PASSWORD) {
    console.warn('[WARN] APP_PASSWORD 未設定，API 與前端目前對任何連得到這台主機的人開放，沒有密碼保護。正式環境請務必在 .env 設定 APP_PASSWORD。');
  }
  // 只針對登入失敗（401）的請求計數，成功登入後的正常操作不受影響，
  // 避免同一個 IP 短時間內一直猜密碼。
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: '登入失敗次數過多，請稍後再試。' },
  });
  app.use(loginLimiter);

  // /api/auth/* 本身要能在還沒登入時呼叫（登入、查詢登入狀態），不能被下面的認證擋住；
  // 其餘所有 /api/* 才需要 session cookie 或 Basic Auth。前端靜態檔案（HTML/JS）不擋，
  // 讓瀏覽器先把 React app 載出來，由前端自己判斷要顯示登入頁還是實際內容。
  app.use('/api/auth', authRouter);
  app.use('/api', sessionOrBasicAuth);

  app.use('/api/accounts', accountBalanceRouter); // /:id/balance — must come before the plain accounts router
  app.use('/api/accounts', accountsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/recharge', rechargeRouter);
  app.use('/api/telegram-groups', telegramGroupsRouter);
  app.use('/api/billing-cycles', billingCyclesRouter);
  app.use('/api/member-payments', memberPaymentsRouter);
  app.use('/api/balance-adjustments', balanceAdjustmentsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/sync', syncRouter);

  // 錯誤處理：讓路由裡未捕捉的例外回傳 JSON 500，而不是讓 Express 用預設 HTML 錯誤頁
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // 前端靜態檔案（frontend 的 `npm run build` 產出的 dist/）
  const frontendDist = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '..', 'public');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}
