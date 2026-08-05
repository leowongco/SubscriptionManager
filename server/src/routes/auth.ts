import { Router } from 'express';
import { createSessionToken, parseCookies, verifySessionToken, safeCompare, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '../lib/session';

export const authRouter = Router();

function cookieAttributes(req: any, maxAgeSeconds: number): string {
  const attrs = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  // 只有實際透過 HTTPS 連線時才加 Secure，VPS 上沒接反代 TLS、純 HTTP 直連的情況
  // 加了 Secure 瀏覽器會直接不設這個 cookie，等於整個登入機制失效。
  if (req.secure) attrs.push('Secure');
  return attrs.join('; ');
}

authRouter.post('/login', (req, res) => {
  const appUser = process.env.APP_USERNAME || 'admin';
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return res.status(400).json({ error: '伺服器未設定 APP_PASSWORD，無法使用登入功能' });
  }

  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' ||
      !safeCompare(username, appUser) || !safeCompare(password, appPassword)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }

  const token = createSessionToken();
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(req, SESSION_TTL_SECONDS)}`);
  res.json({ message: '登入成功' });
});

authRouter.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; ${cookieAttributes(req, 0)}`);
  res.json({ message: '已登出' });
});

authRouter.get('/me', (req, res) => {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return res.json({ authenticated: true, username: process.env.APP_USERNAME || 'admin' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const authenticated = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
  res.json({ authenticated, username: authenticated ? (process.env.APP_USERNAME || 'admin') : null });
});
