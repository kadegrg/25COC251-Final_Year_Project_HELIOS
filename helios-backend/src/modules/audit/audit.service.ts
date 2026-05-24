import { createAuditEvent, type AuditEventInput } from './audit.repository.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import { logger } from '../../core/logging/logger.js';
import type { RequestContext } from '../../types/request-context.js';
import type { PoolClient } from '../../db/index.js';

export async function logAuditEvent(
  ctx: RequestContext,
  action: string,
  status: 'success' | 'failure' | 'error',
  extra?: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> },
  client?: PoolClient,
): Promise<void> {
  const input: AuditEventInput = {
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    action,
    targetType: extra?.targetType,
    targetId: extra?.targetId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
    status,
    metadata: extra?.metadata,
  };

  try {
    await createAuditEvent(input, client);
    // Event hook: forward audit events to plugins (e.g. SIEM, log forwarding)
    emitEvent(BuiltInHooks.AUDIT_EVENT_CREATED, input).catch(() => {});
  } catch (err) {
    logger.error({ err, action }, 'Failed to write audit event');
  }
}

