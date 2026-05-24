import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { webAuthnConfig } from '../../config/webauthn.config.js';
import { NotFoundError, AppError } from '../../core/errors/app-error.js';
import { withTransaction } from '../../db/transaction.js';
import * as mfaRepo from './mfa.repository.js';
import * as authRepo from '../auth/auth.repository.js';
import { logMfaEvent } from './mfa.audit.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import { addMinutes } from '../../utils/dates.js';
import type { RequestContext } from '../../types/request-context.js';

/**
 * Generate WebAuthn registration options.
 */
export async function generateWebAuthnRegisterOptions(
  userId: string,
  username: string,
  friendlyName: string | undefined,
  ctx: RequestContext,
) {
  const existingCredentials = await mfaRepo.findWebAuthnByUserId(userId);

  const options = await generateRegistrationOptions({
    rpName: webAuthnConfig.rpName,
    rpID: webAuthnConfig.rpID,
    userName: username,
    attestationType: webAuthnConfig.attestationType,
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credential_id,
      transports: (c.transports as any) || undefined,
    })),
    authenticatorSelection: webAuthnConfig.authenticatorSelection,
    timeout: webAuthnConfig.timeout,
  });

  // Create factor + challenge
  const factor = await mfaRepo.createMfaFactor({
    userId,
    factorType: 'webauthn',
    friendlyName: friendlyName || 'Security Key',
  });

  const challenge = await authRepo.createAuthChallenge({
    userId,
    sessionId: ctx.sessionId,
    challengeType: 'webauthn_register',
    challengeData: {
      challenge: options.challenge,
      factorId: factor.id,
    },
    expiresAt: addMinutes(new Date(), 5),
  });

  await logMfaEvent(ctx, 'webauthn.register.options', 'success', 'webauthn', factor.id);

  return {
    options,
    factorId: factor.id,
    challengeId: challenge.id,
  };
}

/**
 * Verify WebAuthn registration response.
 */
export async function verifyWebAuthnRegistration(
  userId: string,
  factorId: string,
  challengeId: string,
  credential: RegistrationResponseJSON,
  ctx: RequestContext,
): Promise<void> {
  const factor = await mfaRepo.findMfaFactorById(factorId);
  if (!factor || factor.user_id !== userId || factor.factor_type !== 'webauthn') {
    throw new NotFoundError('WebAuthn factor');
  }

  // Look up the stored challenge
  const challengeRecord = await authRepo.findAuthChallengeById(challengeId);
  if (
    !challengeRecord ||
    challengeRecord.user_id !== userId ||
    challengeRecord.status !== 'pending' ||
    challengeRecord.challenge_type !== 'webauthn_register'
  ) {
    throw new AppError('Invalid or expired challenge', 400, 'INVALID_CHALLENGE');
  }

  const expectedChallenge = (challengeRecord.challenge_data as any).challenge as string;

  return withTransaction(async (client) => {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      await logMfaEvent(ctx, 'webauthn.register.verify', 'failure', 'webauthn', factorId);
      throw new AppError('WebAuthn registration verification failed', 400, 'WEBAUTHN_VERIFICATION_FAILED');
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await mfaRepo.createWebAuthnCredential(
      {
        factorId,
        userId,
        credentialId: regCredential.id,
        publicKey: Buffer.from(regCredential.publicKey),
        counter: regCredential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: (credential.response as any).transports || null,
      },
      client,
    );

    await mfaRepo.verifyMfaFactor(factorId, client);
    await authRepo.updateAuthChallengeStatus(challengeId, 'completed');
    await emitEvent(BuiltInHooks.MFA_FACTOR_ENROLLED, { userId, factorId, factorType: 'webauthn' });
    await logMfaEvent(ctx, 'webauthn.register.verified', 'success', 'webauthn', factorId);
  });
}

/**
 * Generate WebAuthn authentication options.
 */
export async function generateWebAuthnAuthOptions(userId: string, ctx: RequestContext) {
  const credentials = await mfaRepo.findWebAuthnByUserId(userId);
  if (credentials.length === 0) {
    throw new NotFoundError('WebAuthn credentials');
  }

  const options = await generateAuthenticationOptions({
    rpID: webAuthnConfig.rpID,
    allowCredentials: credentials.map((c) => ({
      id: c.credential_id,
      transports: (c.transports as any) || undefined,
    })),
    timeout: webAuthnConfig.timeout,
    userVerification: 'preferred',
  });

  const challenge = await authRepo.createAuthChallenge({
    userId,
    sessionId: ctx.sessionId,
    challengeType: 'webauthn_authenticate',
    challengeData: { challenge: options.challenge },
    expiresAt: addMinutes(new Date(), 5),
  });

  return { options, challengeId: challenge.id };
}

/**
 * Verify WebAuthn authentication response.
 */
export async function verifyWebAuthnAuthentication(
  userId: string,
  challengeId: string,
  credential: AuthenticationResponseJSON,
  ctx: RequestContext,
): Promise<boolean> {
  const challenge = await authRepo.findAuthChallengeById(challengeId);
  if (!challenge || challenge.user_id !== userId || challenge.status !== 'pending') {
    throw new AppError('Invalid challenge', 400, 'INVALID_CHALLENGE');
  }

  const storedChallenge = (challenge.challenge_data as any).challenge;
  const webauthnCred = await mfaRepo.findWebAuthnByCredentialId(credential.id);
  if (!webauthnCred || webauthnCred.user_id !== userId) {
    throw new NotFoundError('WebAuthn credential');
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: storedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      credential: {
        id: webauthnCred.credential_id,
        publicKey: new Uint8Array(webauthnCred.public_key),
        counter: Number(webauthnCred.counter),
        transports: (webauthnCred.transports as any) || undefined,
      },
    });

    if (!verification.verified) {
      await logMfaEvent(ctx, 'webauthn.authenticate', 'failure', 'webauthn');
      return false;
    }

    // Update counter
    await mfaRepo.updateWebAuthnCounter(
      webauthnCred.credential_id,
      verification.authenticationInfo.newCounter,
    );

    await authRepo.updateAuthChallengeStatus(challengeId, 'completed');
    await emitEvent(BuiltInHooks.MFA_CHALLENGE_VERIFIED, { userId, factorType: 'webauthn' });
    await logMfaEvent(ctx, 'webauthn.authenticate', 'success', 'webauthn');

    return true;
  } catch (err) {
    await logMfaEvent(ctx, 'webauthn.authenticate', 'failure', 'webauthn');
    return false;
  }
}

/**
 * Remove a WebAuthn factor.
 */
export async function removeWebAuthnFactor(userId: string, factorId: string, ctx: RequestContext): Promise<void> {
  const factor = await mfaRepo.findMfaFactorById(factorId);
  if (!factor || factor.user_id !== userId || factor.factor_type !== 'webauthn') {
    throw new NotFoundError('WebAuthn factor');
  }

  await mfaRepo.deleteMfaFactor(factorId);
  await emitEvent(BuiltInHooks.MFA_FACTOR_REMOVED, { userId, factorId, factorType: 'webauthn' });
  await logMfaEvent(ctx, 'webauthn.removed', 'success', 'webauthn', factorId);
}


