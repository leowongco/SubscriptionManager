import { Router } from 'express';
import { db } from '../db';

export const historyRouter = Router();

// 只讀端點：history 是餘額異動的副產物（由 recharge/sync/balance-adjustment 各自的
// transaction 寫入），刻意不提供 POST——那會變成一個可以憑空插入歷史紀錄、
// 卻不會真的改動 accounts.balance 的後門，讓帳目跟實際餘額脫鉤。
historyRouter.get('/', (_req, res) => {
  const results = db.prepare(`
    SELECT h.*, a.apple_id
    FROM history h
    JOIN accounts a ON h.account_id = a.id
    ORDER BY h.created_at DESC
  `).all();
  res.json(results);
});
