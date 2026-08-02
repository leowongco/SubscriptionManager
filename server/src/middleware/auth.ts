import { Request, Response, NextFunction } from 'express';

// 這是內部單人/小團隊使用的工具，不做多帳號系統，只用一組共用帳密擋住整台 API。
// 沒設定 APP_PASSWORD 時視為開發模式，不擋（並在啟動時警告），避免忘記設定就直接鎖死本機開發。
export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const appUser = process.env.APP_USERNAME || 'admin';
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) return next();
  if (req.path === '/health') return next();

  const header = req.headers.authorization;
  if (header && header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
    const pass = separatorIndex === -1 ? '' : decoded.slice(separatorIndex + 1);
    if (user === appUser && pass === appPassword) return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="SubscriptionManager"');
  res.status(401).json({ error: 'Unauthorized' });
}
