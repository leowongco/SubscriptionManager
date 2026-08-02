import { Request } from 'express';
import { db, newId } from '../db';

interface AuditLogInput {
  actionType: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  operator?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const insertAuditLog = db.prepare(`
  INSERT INTO audit_logs
    (id, action_type, entity_type, entity_id, old_value, new_value, reason, operator, ip_address, user_agent, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function logAudit(input: AuditLogInput): void {
  insertAuditLog.run(
    'audit_' + newId(),
    input.actionType,
    input.entityType,
    input.entityId,
    input.oldValue !== undefined ? JSON.stringify(input.oldValue) : null,
    input.newValue !== undefined ? JSON.stringify(input.newValue) : null,
    input.reason ?? null,
    input.operator ?? 'system',
    input.ipAddress ?? null,
    input.userAgent ?? null,
    new Date().toISOString()
  );
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}
