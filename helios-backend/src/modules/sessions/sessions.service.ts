import { findSessionsByUserId, revokeSession, revokeAllRefreshTokensForSession } from '../auth/auth.repository.js';
import { NotFoundError } from '../../core/errors/app-error.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import type { RequestContext } from '../../types/request-context.js';

export { findSessionsByUserId } from '../auth/auth.repository.js';

export async function revokeSessionById(
  userId: string,
  sessionId: string,
  ctx: RequestContext,
): Promise<void> {
  const sessions = await findSessionsByUserId(userId);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new NotFoundError('Session');

  await revokeAllRefreshTokensForSession(sessionId);
  await revokeSession(sessionId);

  await emitEvent(BuiltInHooks.SESSION_REVOKED, { userId, sessionId });
  await logAuditEvent(ctx, 'session.revoked', 'success', {
    targetType: 'session',
    targetId: sessionId,
  });
}

