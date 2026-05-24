import { hashPassword, verifyPassword } from '../../core/security/password.service.js';
import { InvalidCredentialsError } from '../../core/errors/auth-errors.js';
import { NotFoundError, AppError } from '../../core/errors/app-error.js';
import { findPasswordByUserId } from '../auth/auth.repository.js';
import { updatePasswordHash } from './password.repository.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import { logger } from '../../core/logging/logger.js';
import type { RequestContext } from '../../types/request-context.js';

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ctx: RequestContext,
): Promise<void> {
  const creds = await findPasswordByUserId(userId);
  if (!creds) throw new NotFoundError('Password credentials');

  const valid = await verifyPassword(creds.password_hash, currentPassword);
  if (!valid) {
    await logAuditEvent(ctx, 'password.change', 'failure', {
      targetType: 'user', targetId: userId,
      metadata: { reason: 'invalid_current_password' },
    });
    throw new InvalidCredentialsError();
  }

  const newHash = await hashPassword(newPassword);
  await updatePasswordHash(userId, newHash);

  await emitEvent(BuiltInHooks.PASSWORD_CHANGED, { userId });
  await logAuditEvent(ctx, 'password.change', 'success', {
    targetType: 'user', targetId: userId,
  });
}

export async function forgotPassword(
  email: string,
  ctx: RequestContext,
): Promise<void> {
  // Always return success to prevent user enumeration
  await logAuditEvent(ctx, 'password.forgot_requested', 'success', {
    metadata: { email },
  });

  // TODO: Generate a password reset token, store in DB, send email
  // For now, log the event
  logger.info({ email }, 'Password reset requested — email sending not yet implemented');
  await emitEvent(BuiltInHooks.PASSWORD_RESET_REQUESTED, { email });
}

export async function resetPassword(
  token: string,
  newPassword: string,
  ctx: RequestContext,
): Promise<void> {
  // TODO: Verify reset token from DB, update password
  // Placeholder implementation
  logger.info('Password reset — token verification not yet implemented');
  await emitEvent(BuiltInHooks.PASSWORD_RESET_COMPLETED, {});
  await logAuditEvent(ctx, 'password.reset', 'success', {});
  throw new AppError('Password reset not yet implemented', 501, 'NOT_IMPLEMENTED');
}

