import { Router } from 'express';
import { db } from '../db';

export const auditRouter = Router();

auditRouter.get('/', (req, res) => {
  const actionType = req.query.action_type as string | undefined;
  const entityType = req.query.entity_type as string | undefined;
  const entityId = req.query.entity_id as string | undefined;
  const operator = req.query.operator as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const limit = parseInt((req.query.limit as string) || '100');
  const offset = parseInt((req.query.offset as string) || '0');

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (actionType) { query += ' AND action_type = ?'; params.push(actionType); }
  if (entityType) { query += ' AND entity_type = ?'; params.push(entityType); }
  if (entityId) { query += ' AND entity_id = ?'; params.push(entityId); }
  if (operator) { query += ' AND operator = ?'; params.push(operator); }
  if (startDate) { query += ' AND created_at >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND created_at <= ?'; params.push(endDate); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const results = db.prepare(query).all(...params) as any[];

  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  const countParams: any[] = [];
  if (actionType) { countQuery += ' AND action_type = ?'; countParams.push(actionType); }
  if (entityType) { countQuery += ' AND entity_type = ?'; countParams.push(entityType); }
  if (entityId) { countQuery += ' AND entity_id = ?'; countParams.push(entityId); }
  if (operator) { countQuery += ' AND operator = ?'; countParams.push(operator); }
  if (startDate) { countQuery += ' AND created_at >= ?'; countParams.push(startDate); }
  if (endDate) { countQuery += ' AND created_at <= ?'; countParams.push(endDate); }

  const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

  const parsedResults = results.map((log) => ({
    ...log,
    old_value: log.old_value ? JSON.parse(log.old_value) : null,
    new_value: log.new_value ? JSON.parse(log.new_value) : null,
  }));

  const totalCount = countResult?.total || 0;

  res.json({
    data: parsedResults,
    pagination: { total: totalCount, limit, offset, has_more: totalCount > offset + limit },
  });
});
