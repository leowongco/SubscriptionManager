import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

import { basicAuth } from './middleware/auth';
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

  app.set('trust proxy', true);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (!process.env.APP_PASSWORD) {
    console.warn('[WARN] APP_PASSWORD 未設定，API 與前端目前對任何連得到這台主機的人開放，沒有密碼保護。正式環境請務必在 .env 設定 APP_PASSWORD。');
  }
  app.use(basicAuth);

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
