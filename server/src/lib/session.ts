import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'sm_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

function getSecret(): string {
  // 用 APP_PASSWORD 當簽章密鑰：反正這組密碼本來就只有管理員知道，
  // 不用另外多引入一個 SESSION_SECRET 環境變數增加設定負擔。
  return process.env.APP_PASSWORD || '';
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

// session token 格式：base64url(過期時間戳).HMAC簽章
export function createSessionToken(): string {
  const payload = base64url(String(Date.now() + SESSION_TTL_MS));
  const signature = hmac(payload, getSecret());
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecret();
  if (!token || !secret) return false;

  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = hmac(payload, secret);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expiresAt = parseInt(Buffer.from(payload, 'base64url').toString('utf8'), 10);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
