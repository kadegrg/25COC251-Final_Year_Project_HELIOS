import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';

export interface AuditEventInput {
  userId?: string;
  sessionId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'error';
  metadata?: Record<string, unknown>;
}

const INSERT_SQL = `
  INSERT INTO iam_auth_audit_events
    (user_id, session_id, action, target_type, target_id, ip_address, user_agent, status, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

function buildParams(input: AuditEventInput): unknown[] {
  return [
    input.userId || null,
    input.sessionId || null,
    input.action,
    input.targetType || null,
    input.targetId || null,
    input.ipAddress || null,
    input.userAgent || null,
    input.status,
    JSON.stringify(input.metadata || {}),
  ];
}

export async function createAuditEvent(
  input: AuditEventInput,
  client?: PoolClient,
): Promise<void> {
  const params = buildParams(input);
  if (client) {
    await client.query(INSERT_SQL, params);
  } else {
    await query(INSERT_SQL, params);
  }
}

export async function listAuditEvents(
  filters: { userId?: string; action?: string; limit?: number; offset?: number },
): Promise<any[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.userId) {
    conditions.push(`user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.action) {
    conditions.push(`action = $${paramIdx++}`);
    params.push(filters.action);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await query(
    `SELECT * FROM iam_auth_audit_events ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );
  return result.rows;
}
