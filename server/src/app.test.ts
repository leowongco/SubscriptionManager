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
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';

// Telegram bot 的送訊息/getMe 都是真的打 api.telegram.org，測試環境沒有真的 bot，
// 攔截這些呼叫回傳假資料，讓綁定/提醒流程可以在不連網路的情況下測試。
// telegramSendCalls 記錄每次 sendMessage 實際帶的 chat_id/text，讓測試可以驗證
// 「不同群組的成員有沒有真的送到各自的 chat_id，而不是送錯人」。
const telegramSendCalls: { chat_id: string; text: string }[] = [];
const realFetch = global.fetch;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = async (url: any, options: any) => {
  const urlStr = String(url);
  if (urlStr.includes('api.telegram.org')) {
    if (urlStr.includes('/getMe')) {
      return { ok: true, json: async () => ({ ok: true, result: { username: 'test_bot' } }) } as any;
    }
    if (urlStr.includes('/sendMessage') && options?.body) {
      try {
        const body = JSON.parse(options.body);
        telegramSendCalls.push({ chat_id: String(body.chat_id), text: String(body.text) });
      } catch {
        // ignore malformed body in test double
      }
    }
    return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) } as any;
  }
  return realFetch(url, options);
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('./app');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runSync } = require('./routes/sync');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handleTelegramUpdate } = require('./lib/telegramBot');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runReminderCheck } = require('./reminders');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

const app = createApp();
const AUTH: [string, string] = ['admin', 'testpass'];

after(() => {
  (global as any).fetch = realFetch;
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

test('產生 Telegram 綁定連結，成員 /start 後完成綁定，可再解除', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'tg-bind@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'TG Bind Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, group_name: 'test' });
  const memRes = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subRes.body.id, email: 'bind-member@test.com' });
  assert.equal(memRes.status, 201);

  const linkRes = await request(app).post(`/api/members/${memRes.body.id}/telegram-bind-link`).auth(...AUTH);
  assert.equal(linkRes.status, 200);
  assert.match(linkRes.body.bind_url, /^https:\/\/t\.me\/test_bot\?start=/);

  const token = linkRes.body.bind_url.split('start=')[1];

  await handleTelegramUpdate({
    update_id: 1,
    message: { text: `/start ${token}`, chat: { id: 999888777 } },
  });

  const membersRes = await request(app).get('/api/members').auth(...AUTH);
  const bound = membersRes.body.find((m: any) => m.id === memRes.body.id);
  assert.equal(bound.telegram_chat_id, '999888777');
  assert.equal(bound.telegram_bind_token, null);

  const unbindRes = await request(app).delete(`/api/members/${memRes.body.id}/telegram-bind`).auth(...AUTH);
  assert.equal(unbindRes.status, 200);

  const afterUnbind = await request(app).get('/api/members').auth(...AUTH);
  assert.equal(afterUnbind.body.find((m: any) => m.id === memRes.body.id).telegram_chat_id, null);
});

test('繳費提醒：發送有節流、成員回報只是待確認、要管理員確認才算已繳', async () => {
  const accRes = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'reminder@icloud.com', currency: 'HKD', balance: 0 });
  const svcRes = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Reminder Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const groupRes = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Reminder Group', billing_cycle_type: 'monthly', start_date: '2026-01-01' });
  const subRes = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accRes.body.id, service_id: svcRes.body.id, telegram_group_id: groupRes.body.id, group_name: 'test' });
  const memRes = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subRes.body.id, email: 'reminder-member@test.com' });

  const linkRes = await request(app).post(`/api/members/${memRes.body.id}/telegram-bind-link`).auth(...AUTH);
  const token = linkRes.body.bind_url.split('start=')[1];
  await handleTelegramUpdate({ update_id: 2, message: { text: `/start ${token}`, chat: { id: 111222333 } } });

  const cycleRes = await request(app).post('/api/billing-cycles').auth(...AUTH)
    .send({ telegram_group_id: groupRes.body.id, start_date: '2026-01-01', end_date: '2026-01-31', amount_per_member: 20 });
  assert.equal(cycleRes.body.member_count, 1);

  const firstRun = await runReminderCheck();
  assert.equal(firstRun.sent, 1);

  const secondRun = await runReminderCheck();
  assert.equal(secondRun.sent, 0);

  const paymentsRes = await request(app).get(`/api/member-payments?billing_cycle_id=${cycleRes.body.id}`).auth(...AUTH);
  const payment = paymentsRes.body[0];
  assert.ok(payment.last_reminded_at);

  await handleTelegramUpdate({
    update_id: 3,
    callback_query: { id: 'cb1', data: `report_paid:${payment.id}`, message: { chat: { id: 111222333 } } },
  });

  const afterReport = await request(app).get(`/api/member-payments?id=${payment.id}`).auth(...AUTH);
  assert.ok(afterReport.body.payment_reported_at);
  assert.equal(afterReport.body.paid, 0);

  const confirmRes = await request(app).put(`/api/member-payments?id=${payment.id}`).auth(...AUTH)
    .send({ paid: true });
  assert.equal(confirmRes.status, 200);
  assert.equal(confirmRes.body.paid, 1);
});

test('不同 Telegram 群組的成員各自綁定自己的 chat_id，提醒不會送錯群組', async () => {
  const accA = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'multi-group-a@icloud.com', currency: 'HKD', balance: 0 });
  const accB = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'multi-group-b@icloud.com', currency: 'HKD', balance: 0 });
  const svc = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Multi Group Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });

  const groupA = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Group Alpha', billing_cycle_type: 'monthly', start_date: '2026-01-01' });
  const groupB = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Group Beta', billing_cycle_type: 'monthly', start_date: '2026-01-01' });

  const subA = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accA.body.id, service_id: svc.body.id, telegram_group_id: groupA.body.id, group_name: 'test' });
  const subB = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: accB.body.id, service_id: svc.body.id, telegram_group_id: groupB.body.id, group_name: 'test' });

  const memA = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subA.body.id, email: 'member-a@test.com' });
  const memB = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: subB.body.id, email: 'member-b@test.com' });

  const linkA = await request(app).post(`/api/members/${memA.body.id}/telegram-bind-link`).auth(...AUTH);
  const linkB = await request(app).post(`/api/members/${memB.body.id}/telegram-bind-link`).auth(...AUTH);
  const tokenA = linkA.body.bind_url.split('start=')[1];
  const tokenB = linkB.body.bind_url.split('start=')[1];

  // 兩個成員各自用「自己的」Telegram chat_id 綁定——刻意選兩個不會混淆的假 ID
  await handleTelegramUpdate({ update_id: 10, message: { text: `/start ${tokenA}`, chat: { id: 'chat-AAA-111' } } });
  await handleTelegramUpdate({ update_id: 11, message: { text: `/start ${tokenB}`, chat: { id: 'chat-BBB-222' } } });

  const cycleA = await request(app).post('/api/billing-cycles').auth(...AUTH)
    .send({ telegram_group_id: groupA.body.id, start_date: '2026-01-01', end_date: '2026-01-31', amount_per_member: 15 });
  const cycleB = await request(app).post('/api/billing-cycles').auth(...AUTH)
    .send({ telegram_group_id: groupB.body.id, start_date: '2026-01-01', end_date: '2026-01-31', amount_per_member: 25 });
  assert.equal(cycleA.body.member_count, 1);
  assert.equal(cycleB.body.member_count, 1);

  telegramSendCalls.length = 0; // 只看這次提醒觸發的呼叫，排除前面測試留下的紀錄
  const result = await runReminderCheck();
  assert.equal(result.sent, 2);

  const callToA = telegramSendCalls.find((c) => c.chat_id === 'chat-AAA-111');
  const callToB = telegramSendCalls.find((c) => c.chat_id === 'chat-BBB-222');

  assert.ok(callToA, 'Group Alpha 的成員應該收到自己 chat_id 的提醒');
  assert.match(callToA!.text, /Group Alpha/);
  assert.doesNotMatch(callToA!.text, /Group Beta/);
  assert.match(callToA!.text, /15/);

  assert.ok(callToB, 'Group Beta 的成員應該收到自己 chat_id 的提醒');
  assert.match(callToB!.text, /Group Beta/);
  assert.doesNotMatch(callToB!.text, /Group Alpha/);
  assert.match(callToB!.text, /25/);

  // 沒有任何一筆送到對方的 chat_id 上
  assert.equal(telegramSendCalls.filter((c) => c.chat_id === 'chat-AAA-111').length, 1);
  assert.equal(telegramSendCalls.filter((c) => c.chat_id === 'chat-BBB-222').length, 1);
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

test('Telegram 群組可以設定 chat_id，也可以清空', async () => {
  const groupRes = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Chat ID Test Group', billing_cycle_type: 'monthly', start_date: '2026-01-01', chat_id: '-1009876543210' });
  assert.equal(groupRes.status, 201);
  assert.equal(groupRes.body.chat_id, '-1009876543210');

  const clearRes = await request(app).put(`/api/telegram-groups?id=${groupRes.body.id}`).auth(...AUTH)
    .send({ chat_id: '' });
  assert.equal(clearRes.status, 200);
  assert.equal(clearRes.body.chat_id, null);
});

test('群組設定 chat_id 後，繳費提醒會發到群組聊天室、列出未繳名單，且有節流', async () => {
  const acc1 = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'group-broadcast-1@icloud.com', currency: 'HKD', balance: 0 });
  const acc2 = await request(app).post('/api/accounts').auth(...AUTH)
    .send({ apple_id: 'group-broadcast-2@icloud.com', currency: 'HKD', balance: 0 });
  const svc = await request(app).post('/api/services').auth(...AUTH)
    .send({ name: 'Group Broadcast Service', base_price: 10, currency: 'HKD', cycle: 'monthly' });
  const group = await request(app).post('/api/telegram-groups').auth(...AUTH)
    .send({ name: 'Broadcast Group', billing_cycle_type: 'monthly', start_date: '2026-01-01', chat_id: 'group-chat-999' });

  const sub1 = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: acc1.body.id, service_id: svc.body.id, telegram_group_id: group.body.id, group_name: 'test' });
  const sub2 = await request(app).post('/api/subscriptions').auth(...AUTH)
    .send({ account_id: acc2.body.id, service_id: svc.body.id, telegram_group_id: group.body.id, group_name: 'test' });

  const mem1 = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: sub1.body.id, email: 'broadcast-unpaid@test.com' });
  const mem2 = await request(app).post('/api/members').auth(...AUTH)
    .send({ subscription_id: sub2.body.id, email: 'broadcast-paid@test.com' });

  const cycle = await request(app).post('/api/billing-cycles').auth(...AUTH)
    .send({ telegram_group_id: group.body.id, start_date: '2026-01-01', end_date: '2026-01-31', amount_per_member: 30 });
  assert.equal(cycle.body.member_count, 2);

  const paymentsRes = await request(app).get(`/api/member-payments?billing_cycle_id=${cycle.body.id}`).auth(...AUTH);
  const paymentForMem2 = paymentsRes.body.find((p: any) => p.member_id === mem2.body.id);
  await request(app).put(`/api/member-payments?id=${paymentForMem2.id}`).auth(...AUTH).send({ paid: true });

  telegramSendCalls.length = 0;
  const firstRun = await runReminderCheck();
  assert.equal(firstRun.sent, 1);

  const groupCall = telegramSendCalls.find((c) => c.chat_id === 'group-chat-999');
  assert.ok(groupCall, '應該送一則訊息到群組聊天室');
  assert.match(groupCall!.text, /Broadcast Group/);
  assert.match(groupCall!.text, /broadcast-unpaid@test\.com/);
  assert.doesNotMatch(groupCall!.text, /broadcast-paid@test\.com/);

  // 節流：同一天再跑一次不會重複發送到群組
  telegramSendCalls.length = 0;
  const secondRun = await runReminderCheck();
  assert.equal(telegramSendCalls.filter((c) => c.chat_id === 'group-chat-999').length, 0);
  assert.equal(secondRun.sent, 0);
});
