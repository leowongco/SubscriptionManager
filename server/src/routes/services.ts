import { Router } from 'express';
import { db, newId } from '../db';

export const servicesRouter = Router();

servicesRouter.get('/', (_req, res) => {
  const results = db.prepare('SELECT * FROM services').all();
  res.json(results);
});

servicesRouter.post('/', (req, res) => {
  const body = req.body || {};
  const id = body.id || newId();

  db.prepare(
    'INSERT INTO services (id, name, base_price, currency, cycle, next_price, effective_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.name, body.base_price, body.currency, body.cycle, body.next_price || null, body.effective_date || null);

  res.status(201).json({ id, message: 'Service created successfully' });
});

servicesRouter.put('/', (req, res) => {
  const body = req.body || {};
  const id = body.id;
  if (!id) return res.status(400).send('Missing Service ID');

  db.prepare(
    'UPDATE services SET name = ?, base_price = ?, currency = ?, cycle = ?, next_price = ?, effective_date = ? WHERE id = ?'
  ).run(body.name, body.base_price, body.currency, body.cycle, body.next_price || null, body.effective_date || null, id);

  res.json({ message: 'Service updated successfully' });
});

servicesRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing Service ID');

  const subscriptionCount = (db.prepare('SELECT COUNT(*) as c FROM subscriptions WHERE service_id = ?').get(id) as any).c;
  if (subscriptionCount > 0) {
    return res.status(400).json({ error: `無法刪除服務，仍有 ${subscriptionCount} 筆訂閱使用這個服務，請先移除訂閱。` });
  }

  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  res.json({ message: 'Service deleted successfully' });
});
