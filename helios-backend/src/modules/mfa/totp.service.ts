import { TOTP, generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { authConfig } from '../../config/auth.config.js';
import { encrypt, decrypt } from '../../core/security/encryption.service.js';
import { NotFoundError, AppError } from '../../core/errors/app-error.js';
import { withTransaction } from '../../db/transaction.js';
import * as mfaRepo from './mfa.repository.js';
import { logMfaEvent } from './mfa.audit.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import type { RequestContext } from '../../types/request-context.js';

const totpConfig = {
  digits: authConfig.totp.digits,
  period: authConfig.totp.period,
};

export interface TotpEnrolResult {
  factorId: string;
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

/**
 * Start TOTP enrolment — generate a secret and QR code.
 */
export async function startTotpEnrolment(userId: string, ctx: RequestContext): Promise<TotpEnrolResult> {
  // Check for existing unverified TOTP factor
  const factors = await mfaRepo.findMfaFactorsByUserId(userId);
  const existingTotp = factors.find((f) => f.factor_type === 'totp' && !f.is_verified);
  if (existingTotp) {
    await mfaRepo.deleteMfaFactor(existingTotp.id);
  }

  const verifiedTotp = factors.find((f) => f.factor_type === 'totp' && f.is_verified);
  if (verifiedTotp) {
    throw new AppError('TOTP already enrolled', 409, 'TOTP_ALREADY_ENROLLED');
  }

  return withTransaction(async (client) => {
    const factor = await mfaRepo.createMfaFactor(
      { userId, factorType: 'totp', friendlyName: 'Authenticator App' },
      client,
    );

    const secret = generateSecret();
    const encryptedSecret = encrypt(secret);

    await mfaRepo.createTotpCredential(
      {
        factorId: factor.id,
        userId,
        encryptedSecret,
        algorithm: authConfig.totp.algorithm,
        digits: authConfig.totp.digits,
        period: authConfig.totp.period,
      },
      client,
    );

    const uri = generateURI({
      label: 'user',
      issuer: authConfig.totp.issuer,
      secret,
      digits: totpConfig.digits,
      period: totpConfig.period,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(uri);

    await logMfaEvent(ctx, 'totp.enrol.started', 'success', 'totp', factor.id);

    return {
      factorId: factor.id,
      secret,
      uri,
      qrCodeDataUrl,
    };
  });
}

/**
 * Verify TOTP code during enrolment to activate the factor.
 */
export async function verifyTotpEnrolment(
  userId: string,
  factorId: string,
  code: string,
  ctx: RequestContext,
): Promise<void> {
  const factor = await mfaRepo.findMfaFactorById(factorId);
  if (!factor || factor.user_id !== userId || factor.factor_type !== 'totp') {
    throw new NotFoundError('TOTP factor');
  }
  if (factor.is_verified) {
    throw new AppError('Factor already verified', 409, 'ALREADY_VERIFIED');
  }

  const totpCred = await mfaRepo.findTotpByFactorId(factorId);
  if (!totpCred) throw new NotFoundError('TOTP credentials');

  const secret = decrypt(totpCred.encrypted_secret);
  const result = verifySync({ secret, token: code, digits: totpConfig.digits, period: totpConfig.period });

  if (!result) {
    await logMfaEvent(ctx, 'totp.enrol.verify', 'failure', 'totp', factorId);
    throw new AppError('Invalid TOTP code', 400, 'INVALID_TOTP_CODE');
  }

  await mfaRepo.verifyMfaFactor(factorId);
  await emitEvent(BuiltInHooks.MFA_FACTOR_ENROLLED, { userId, factorId, factorType: 'totp' });
  await logMfaEvent(ctx, 'totp.enrol.verified', 'success', 'totp', factorId);
}

/**
 * Verify a TOTP code for MFA challenge.
 */
export async function verifyTotpCode(userId: string, code: string, ctx: RequestContext): Promise<boolean> {
  const totpCred = await mfaRepo.findTotpByUserId(userId);
  if (!totpCred) throw new NotFoundError('TOTP credentials');

  const secret = decrypt(totpCred.encrypted_secret);
  const result = verifySync({ secret, token: code, digits: totpConfig.digits, period: totpConfig.period });

  if (!result) {
    await logMfaEvent(ctx, 'totp.verify', 'failure', 'totp');
    return false;
  }

  await emitEvent(BuiltInHooks.MFA_CHALLENGE_VERIFIED, { userId, factorType: 'totp' });
  await logMfaEvent(ctx, 'totp.verify', 'success', 'totp');
  return true;
}

/**
 * Remove a TOTP factor.
 */
export async function removeTotpFactor(userId: string, factorId: string, ctx: RequestContext): Promise<void> {
  const factor = await mfaRepo.findMfaFactorById(factorId);
  if (!factor || factor.user_id !== userId || factor.factor_type !== 'totp') {
    throw new NotFoundError('TOTP factor');
  }

  await mfaRepo.deleteMfaFactor(factorId);
  await emitEvent(BuiltInHooks.MFA_FACTOR_REMOVED, { userId, factorId, factorType: 'totp' });
  await logMfaEvent(ctx, 'totp.removed', 'success', 'totp', factorId);
}

