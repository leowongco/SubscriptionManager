import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

// 這幾個環境變數必須在 require('./app')（連帶初始化 ./db）之前設好，
// 所以這裡刻意用 require 而不是 import——import 會被提升到檔案最上面執行，
// 這樣就沒辦法在載入 app 之前先指定測試專用的 DB_PATH。
const dbPath = path.join(os.tmpdir(), `sm-test-${process.pid}-${Math.random().toString(36).slice(2)}.db`);
process.env.DB_PATH = dbPath;
process.env.APP_USERNAME = 'admin';
process.env.APP_PASSWORD = 'testpass';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('./app');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runSync } = require('./routes/sync');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

const app = createApp();
const AUTH: [string, string] = ['admin', 'testpass'];

after(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(dbPath + suffix, { force: true });
  }
});

test('health check 不需要認證', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
});

test('API 沒帶密碼要擋下來(401)', async () => {
  const res = await request(app).get('/api/accounts');
  assert.equal(res.status, 401);
});

test('API 帶正確密碼可以正常存取', async () => {
  const res = await request(app).get('/api/accounts').auth(...AUTH);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test('登入帳密錯誤要回 401', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
  assert.equal(res.status, 401);
});

test('/api/auth/me 沒登入時回 authenticated=false', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.body.authenticated, false);
});

test('網頁表單登入成功後,靠 session cookie 就能存取 API,登出後失效', async () => {
  const agent = request.agent(app);

  const loginRes = await agent.post('/api/auth/login').send({ username: 'admin', password: 'testpass' });
  assert.equal(loginRes.status, 200);

  const meRes = await agent.get('/api/auth/me');
  assert.equal(meRes.body.authenticated, true);

  // 不帶 Basic Auth header，純靠 cookie 也要能存取
  const apiRes = await agent.get('/api/accounts');
  assert.equal(apiRes.status, 200);

  const logoutRes = await agent.post('/api/auth/logout');
  assert.equal(logoutRes.status, 200);

  const afterLogout = await agent.get('/api/accounts');
  assert.equal(afterLogout.status, 401);
});

test('訂閱的貨幣必須跟帳號地區一致，不一致要擋下來', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'currency-test@icloud.com', currency: 'HKD', balance: 0 });
  assert.equal(accRes.status, 201);

  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Mismatch Service', base_price: 10, currency: 'TRY', cycle: 'monthly' });
  assert.equal(svcRes.status, 201);

  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, group_name: 'test' });
  assert.equal(subRes.status, 400);
  assert.match(subRes.body.error, /貨幣不符/);
});

test('刪除仍有訂閱的帳號要回友善錯誤，而不是外鍵錯誤', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'delete-test@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Delete Test Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, group_name: 'test' });
  assert.equal(subRes.status, 201);

  const delRes = await request(app).delete(`/api/accounts?id=${accRes.body.id}`).auth(...AUTH);
  assert.equal(delRes.status, 400);
  assert.match(delRes.body.error, /無法刪除帳號/);
});

test('訂閱可以關聯 Telegram 群組，群組的關聯帳號數要更新', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'tg-link-test@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'TG Link Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const groupRes = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Test Group', billing_cycle_type: 'monthly', start_date: '2026-01-01' });
  assert.equal(groupRes.status, 201);

  const beforeList = await request(app).get('/api/telegram-groups').auth(...AUTH);
  const beforeGroup = beforeList.body.find((g: any) => g.id === groupRes.body.id);
  assert.equal(beforeGroup.account_count, 0);

  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({
      account_id: accRes.body.id,
      service_id: svcRes.body.id,
      telegram_group_id: groupRes.body.id,
      group_name: 'test',
    });
  assert.equal(subRes.status, 201);

  const afterList = await request(app).get('/api/telegram-groups').auth(...AUTH);
  const afterGroup = afterList.body.find((g: any) => g.id === groupRes.body.id);
  assert.equal(afterGroup.account_count, 1);
});

test('新增 Telegram 群組沒填開始收款日期要擋下來', async () => {
  const res = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'No Start Date Group', billing_cycle_type: 'monthly' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /start_date/);
});

test('編輯帳號不能透過 PUT 直接改餘額，只有「調整餘額」流程可以改', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'no-balance-edit@icloud.com', currency: 'HKD', balance: 50 });
  assert.equal(accRes.status, 201);

  const putRes = await request(app).put('/api/accounts').auth(...AUTH)
    .send({ id: accRes.body.id, apple_id: 'no-balance-edit@icloud.com', currency: 'HKD', balance: 99999 });
  assert.equal(putRes.status, 200);

  const listRes = await request(app).get('/api/accounts').auth(...AUTH);
  const acc = listRes.body.find((a: any) => a.id === accRes.body.id);
  assert.equal(acc.balance, 50);

  const adjustRes = await request(app).patch(`/api/accounts/${accRes.body.id}/balance`).auth(...AUTH)
    .send({ adjustment_amount: 10, reason: '測試調整', operator: 'tester' });
  assert.equal(adjustRes.status, 200);
  assert.equal(adjustRes.body.new_balance, 60);
});

test('同一天重複執行 sync 不會對同一筆訂閱重複扣款', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'sync-idem@icloud.com', currency: 'HKD', balance: 1000 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Idempotent Service', base_price: 100, currency: 'HKD', cycle: 'monthly' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, group_name: 'test' });
  assert.equal(subRes.status, 201);

  await runSync();
  const afterFirst = await request(app).get('/api/accounts').auth(...AUTH);
  const balanceAfterFirst = afterFirst.body.find((a: any) => a.id === accRes.body.id).balance;
  assert.equal(balanceAfterFirst, 900);

  await runSync();
  const afterSecond = await request(app).get('/api/accounts').auth(...AUTH);
  const balanceAfterSecond = afterSecond.body.find((a: any) => a.id === accRes.body.id).balance;
  assert.equal(balanceAfterSecond, 900);
});

test('新增服務時 cycle/currency/base_price 不合法要擋下來', async () => {
  const res = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Weekly Service', base_price: 10, currency: 'HKD', cycle: 'weekly' });
  assert.equal(res.status, 400);
});

test('刪除仍有成員的訂閱要擋下來', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'sub-del-member@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Sub Delete Member Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, group_name: 'test' });
  const memRes = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subRes.body.id, email: 'member@test.com' });
  assert.equal(memRes.status, 201);

  const delRes = await request(app).delete(`/api/subscriptions?id=${subRes.body.id}`).auth(...AUTH);
  assert.equal(delRes.status, 400);
  assert.match(delRes.body.error, /無法刪除訂閱/);
});

test('帳單週期建立後才加入的成員，也要自動補上待繳紀錄', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'backfill@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Backfill Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const groupRes = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Backfill Group', billing_cycle_type: 'monthly', start_date: '2026-01-01' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, telegram_group_id: groupRes.body.id, group_name: 'test' });

  const cycleRes = await request(app).post('/api/billing-cycles').auth(...AUTH)
    .send({ telegram_group_id: groupRes.body.id, start_date: '2026-01-01', end_date: '2026-01-31', amount_per_member: 20 });
  assert.equal(cycleRes.status, 201);
  assert.equal(cycleRes.body.member_count, 0);

  const memRes = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subRes.body.id, email: 'late-joiner@test.com' });
  assert.equal(memRes.status, 201);

  const paymentsRes = await request(app).get(`/api/member-payments?billing_cycle_id=${cycleRes.body.id}`).auth(...AUTH);
  assert.equal(paymentsRes.body.length, 1);
  assert.equal(paymentsRes.body[0].amount, 20);
});
