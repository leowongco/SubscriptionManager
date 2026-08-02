import { Router } from 'express';
import { db, newId } from '../db';

export const membersRouter = Router();

membersRouter.get('/', (req, res) => {
  const subscriptionId = req.query.subscription_id as string | undefined;

  let query = 'SELECT * FROM members';
  const params: any[] = [];
  if (subscriptionId) {
    query += ' WHERE subscription_id = ?';
    params.push(subscriptionId);
  }

  const results = db.prepare(query).all(...params);
  res.json(results);
});

membersRouter.post('/', (req, res) => {
  const body = req.body || {};
  const id = body.id || newId();

  db.prepare(
    'INSERT INTO members (id, subscription_id, email, payment_status, memo) VALUES (?, ?, ?, ?, ?)'
  ).run(id, body.subscription_id, body.email, body.payment_status ? 1 : 0, body.memo || null);

  res.status(201).json({ id, message: 'Member created successfully' });
});

membersRouter.put('/', (req, res) => {
  const body = req.body || {};
  const id = body.id;
  if (!id) return res.status(400).send('Missing Member ID');

  db.prepare(
    'UPDATE members SET subscription_id = ?, email = ?, payment_status = ?, memo = ? WHERE id = ?'
  ).run(body.subscription_id, body.email, body.payment_status ? 1 : 0, body.memo || null, id);

  res.json({ message: 'Member updated successfully' });
});

membersRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing Member ID');

  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.json({ message: 'Member deleted successfully' });
});
