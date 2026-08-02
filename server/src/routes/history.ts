import { Router } from 'express';
import { db, newId } from '../db';

export const historyRouter = Router();

historyRouter.get('/', (_req, res) => {
  const results = db.prepare(`
    SELECT h.*, a.apple_id
    FROM history h
    JOIN accounts a ON h.account_id = a.id
    ORDER BY h.created_at DESC
  `).all();
  res.json(results);
});

historyRouter.post('/', (req, res) => {
  const body = req.body || {};
  const id = body.id || newId();

  db.prepare(
    'INSERT INTO history (id, account_id, type, amount) VALUES (?, ?, ?, ?)'
  ).run(id, body.account_id, body.type, body.amount);

  res.status(201).json({ id, message: 'History created successfully' });
});
