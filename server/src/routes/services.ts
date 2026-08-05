import { Router } from 'express';
import { db, newId } from '../db';
import { logAudit, getClientIP, getUserAgent } from '../lib/audit';
import { VALID_CURRENCIES } from '../lib/currency';

export const servicesRouter = Router();

const VALID_CYCLES = ['monthly', 'yearly'];

function validateServiceBody(body: any): string | null {
  if (!body.name || typeof body.name !== 'string') return '缺少必填字段: name';
  if (typeof body.base_price !== 'number' || !(body.base_price > 0)) return 'base_price 必須是大於 0 的數字';
  if (!VALID_CURRENCIES.includes(body.currency)) return 'Invalid currency code';
  if (!VALID_CYCLES.includes(body.cycle)) return 'cycle 必須是 monthly 或 yearly';
  return null;
}

servicesRouter.get('/', (_req, res) => {
  const results = db.prepare('SELECT * FROM services').all();
  res.json(results);
});

servicesRouter.post('/', (req, res) => {
  const body = req.body || {};
  const validationError = validateServiceBody(body);
  if (validationError) return res.status(400).json({ error: validationError });

  const id = body.id || newId();

  db.prepare(
    'INSERT INTO services (id, name, base_price, currency, cycle, next_price, effective_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.name, body.base_price, body.currency, body.cycle, body.next_price || null, body.effective_date || null);

  logAudit({
    actionType: 'service_create',
    entityType: 'service',
    entityId: id,
    newValue: { name: body.name, base_price: body.base_price, currency: body.currency, cycle: body.cycle },
    reason: 'Service created',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.status(201).json({ id, message: 'Service created successfully' });
});

servicesRouter.put('/', (req, res) => {
  const body = req.body || {};
  const id = body.id;
  if (!id) return res.status(400).send('Missing Service ID');

  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Service not found' });

  const validationError = validateServiceBody(body);
  if (validationError) return res.status(400).json({ error: validationError });

  db.prepare(
    'UPDATE services SET name = ?, base_price = ?, currency = ?, cycle = ?, next_price = ?, effective_date = ? WHERE id = ?'
  ).run(body.name, body.base_price, body.currency, body.cycle, body.next_price || null, body.effective_date || null, id);

  logAudit({
    actionType: 'service_update',
    entityType: 'service',
    entityId: id,
    oldValue: { name: existing.name, base_price: existing.base_price, currency: existing.currency, cycle: existing.cycle },
    newValue: { name: body.name, base_price: body.base_price, currency: body.currency, cycle: body.cycle },
    reason: 'Service updated',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Service updated successfully' });
});

servicesRouter.delete('/', (req, res) => {
  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).send('Missing Service ID');

  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Service not found' });

  const subscriptionCount = (db.prepare('SELECT COUNT(*) as c FROM subscriptions WHERE service_id = ?').get(id) as any).c;
  if (subscriptionCount > 0) {
    return res.status(400).json({ error: `無法刪除服務，仍有 ${subscriptionCount} 筆訂閱使用這個服務，請先移除訂閱。` });
  }

  db.prepare('DELETE FROM services WHERE id = ?').run(id);

  logAudit({
    actionType: 'service_delete',
    entityType: 'service',
    entityId: id,
    oldValue: { name: existing.name, base_price: existing.base_price, currency: existing.currency, cycle: existing.cycle },
    reason: 'Service deleted',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });

  res.json({ message: 'Service deleted successfully' });
});
