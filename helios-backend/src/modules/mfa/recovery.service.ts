import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '../../core/security/recovery-code.service.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, AppError } from '../../core/errors/app-error.js';
import * as mfaRepo from './mfa.repository.js';
import { logMfaEvent } from './mfa.audit.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import type { RequestContext } from '../../types/request-context.js';

/**
 * Generate recovery codes for a user.
 * If codes already exist, they are replaced.
 */
export async function regenerateRecoveryCodes(
  userId: string,
  ctx: RequestContext,
): Promise<string[]> {
  return withTransaction(async (client) => {
    // Delete existing recovery codes
    await mfaRepo.deleteRecoveryCodesByUserId(userId, client);

    // Delete existing recovery factor
    const factors = await mfaRepo.findMfaFactorsByUserId(userId, client);
    const existingFactor = factors.find((f) => f.factor_type === 'recovery');
    if (existingFactor) {
      await mfaRepo.deleteMfaFactor(existingFactor.id, client);
    }

    // Create new recovery factor
    const factor = await mfaRepo.createMfaFactor(
      { userId, factorType: 'recovery', friendlyName: 'Recovery Codes' },
      client,
    );
    await mfaRepo.verifyMfaFactor(factor.id, client);

    // Generate codes
    const plaintextCodes = generateRecoveryCodes();
    const codeHashes = plaintextCodes.map(hashRecoveryCode);

    await mfaRepo.createRecoveryCodes(factor.id, userId, codeHashes, client);

    await logMfaEvent(ctx, 'recovery.regenerated', 'success', 'recovery', factor.id);

    // Return plaintext codes (shown to user once)
    return plaintextCodes;
  });
}

/**
 * Use a recovery code for MFA verification.
 */
export async function useRecoveryCode(
  userId: string,
  code: string,
  ctx: RequestContext,
): Promise<boolean> {
  const unusedCodes = await mfaRepo.findUnusedRecoveryCodes(userId);
  if (unusedCodes.length === 0) {
    throw new NotFoundError('Recovery codes');
  }

  for (const storedCode of unusedCodes) {
    if (verifyRecoveryCode(code, storedCode.code_hash)) {
      await mfaRepo.markRecoveryCodeUsed(storedCode.id);
      await emitEvent(BuiltInHooks.MFA_CHALLENGE_VERIFIED, { userId, factorType: 'recovery' });
      await logMfaEvent(ctx, 'recovery.used', 'success', 'recovery');

      // Warn if running low
      const remainingCount = unusedCodes.length - 1;
      if (remainingCount <= 2) {
        // TODO: Send notification to user about low recovery codes
      }

      return true;
    }
  }

  await logMfaEvent(ctx, 'recovery.used', 'failure', 'recovery');
  return false;
}

