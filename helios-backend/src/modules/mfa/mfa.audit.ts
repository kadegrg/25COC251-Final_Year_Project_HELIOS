import { logAuditEvent } from '../audit/audit.service.js';
import type { RequestContext } from '../../types/request-context.js';

export async function logMfaEvent(
  ctx: RequestContext,
  action: string,
  status: 'success' | 'failure',
  factorType: string,
  factorId?: string,
): Promise<void> {
  await logAuditEvent(ctx, `mfa.${action}`, status, {
    targetType: 'mfa_factor',
    targetId: factorId,
    metadata: { factorType },
  });
}

