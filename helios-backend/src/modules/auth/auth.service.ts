import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import { verifyPassword } from '../../core/security/password.service.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  parseExpiryToMs,
} from '../../core/security/token.service.js';
import { authConfig } from '../../config/auth.config.js';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountDisabledError,
  TokenReuseDetectedError,
  InvalidTokenError,
  SessionExpiredError,
} from '../../core/errors/auth-errors.js';
import { NotFoundError } from '../../core/errors/app-error.js';
import * as authRepo from './auth.repository.js';
import * as mfaRepo from '../mfa/mfa.repository.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import { addMinutes, addDays, isExpired } from '../../utils/dates.js';
import type { RequestContext } from '../../types/request-context.js';
import type { LoginResult, AuthTokenPair } from './auth.types.js';

/**
 * Authenticate a user with email + password.
 * Returns tokens if no MFA is required, or a challenge if MFA is enrolled.
 */
export async function login(
  email: string,
  password: string,
  ctx: RequestContext,
): Promise<LoginResult> {
  // Event hook: notify plugins of login attempt (non-blocking)
  emitEvent(BuiltInHooks.AUTH_PRE_LOGIN, { email }).catch(() => {});

  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    await logAuditEvent(ctx, 'auth.login', 'failure', { metadata: { reason: 'user_not_found' } });
    throw new InvalidCredentialsError();
  }

  // Check user status
  if (user.status === 'disabled' || user.status === 'deleted') {
    throw new AccountDisabledError();
  }

  // Check password credentials
  const creds = await authRepo.findPasswordByUserId(user.id);
  if (!creds) {
    throw new InvalidCredentialsError();
  }

  // Check lockout
  if (creds.locked_until && !isExpired(creds.locked_until)) {
    throw new AccountLockedError();
  }

  // Verify password
  const valid = await verifyPassword(creds.password_hash, password);
  if (!valid) {
    const attempts = await authRepo.incrementFailedAttempts(user.id);
    if (attempts >= authConfig.password.maxLoginAttempts) {
      const lockUntil = addMinutes(new Date(), authConfig.password.lockoutDurationMinutes);
      await authRepo.lockAccount(user.id, lockUntil);
      await logAuditEvent(ctx, 'auth.login', 'failure', {
        targetType: 'user', targetId: user.id,
        metadata: { reason: 'account_locked', attempts },
      });
      throw new AccountLockedError();
    }
    await logAuditEvent(ctx, 'auth.login', 'failure', {
      targetType: 'user', targetId: user.id,
      metadata: { reason: 'invalid_password', attempts },
    });
    throw new InvalidCredentialsError();
  }

  // Password valid — reset failed attempts
  await authRepo.resetFailedAttempts(user.id);

  // Check for MFA factors
  const mfaFactors = await mfaRepo.findVerifiedMfaFactors(user.id);
  const hasMfa = mfaFactors.length > 0;

  if (hasMfa) {
    // Create an MFA challenge — session not yet fully established
    const challenge = await authRepo.createAuthChallenge({
      userId: user.id,
      challengeType: 'mfa_login',
      challengeData: { factorTypes: mfaFactors.map((f) => f.factor_type) },
      expiresAt: addMinutes(new Date(), 5),
    });

    await logAuditEvent(ctx, 'auth.login.mfa_required', 'success', {
      targetType: 'user', targetId: user.id,
    });

    return {
      type: 'mfa_required',
      challengeId: challenge.id,
      availableMethods: [...new Set(mfaFactors.map((f) => f.factor_type))],
    };
  }

  // No MFA — create session and issue tokens
  const result = await createAuthenticatedSession(user.id, 1, ['pwd'], ctx);

  await emitEvent(BuiltInHooks.AUTH_POST_LOGIN, { userId: user.id, sessionId: result.sessionId });
  await logAuditEvent(ctx, 'auth.login', 'success', {
    targetType: 'user', targetId: user.id,
  });

  return {
    type: 'authenticated',
    tokens: result.tokens,
    sessionId: result.sessionId,
  };
}

/**
 * Create a fully authenticated session with tokens.
 */
export async function createAuthenticatedSession(
  userId: string,
  aal: number,
  amr: string[],
  ctx: RequestContext,
): Promise<{ tokens: AuthTokenPair; sessionId: string }> {
  return withTransaction(async (client) => {
    const refreshExpiryMs = parseExpiryToMs(authConfig.jwt.refreshTokenExpiry);
    const sessionExpiresAt = new Date(Date.now() + refreshExpiryMs);

    // Create session
    const session = await authRepo.createSession(
      {
        userId,
        aal,
        amr,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        expiresAt: sessionExpiresAt,
      },
      client,
    );

    // Create refresh token
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const familyId = randomUUID();

    await authRepo.createRefreshToken(
      {
        sessionId: session.id,
        tokenHash,
        familyId,
        generation: 1,
        expiresAt: sessionExpiresAt,
      },
      client,
    );

    // Sign access token
    const accessToken = await signAccessToken({
      userId,
      sessionId: session.id,
      aal,
      amr,
    });

    await emitEvent(BuiltInHooks.SESSION_CREATED, { userId, sessionId: session.id });

    return {
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: Math.floor(parseExpiryToMs(authConfig.jwt.accessTokenExpiry) / 1000),
      },
      sessionId: session.id,
    };
  });
}

/**
 * Refresh an access token using a refresh token.
 * Implements token rotation and reuse detection.
 */
export async function refreshTokens(
  rawRefreshToken: string,
  ctx: RequestContext,
): Promise<AuthTokenPair> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  return withTransaction(async (client) => {
    const storedToken = await authRepo.findRefreshTokenByHash(tokenHash, client);

    if (!storedToken) {
      throw new InvalidTokenError();
    }

    // Check if token is revoked — potential reuse attack
    if (storedToken.is_revoked) {
      // Revoke the entire token family
      await authRepo.revokeRefreshTokenFamily(storedToken.family_id, client);
      // Revoke the session too
      await authRepo.revokeSession(storedToken.session_id, client);

      await emitEvent(BuiltInHooks.AUTH_TOKEN_REUSE_DETECTED, {
        sessionId: storedToken.session_id,
        familyId: storedToken.family_id,
      });
      await logAuditEvent(ctx, 'auth.token_reuse_detected', 'failure', {
        targetType: 'session', targetId: storedToken.session_id,
        metadata: { familyId: storedToken.family_id },
      });

      throw new TokenReuseDetectedError();
    }

    // Check expiry
    if (isExpired(storedToken.expires_at)) {
      throw new InvalidTokenError();
    }

    // Check session
    const session = await authRepo.findSessionById(storedToken.session_id, client);
    if (!session || session.status !== 'active') {
      throw new SessionExpiredError();
    }

    // Revoke old token
    await authRepo.revokeRefreshToken(storedToken.id, client);

    // Issue new refresh token (rotation)
    const newRawToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawToken);
    const refreshExpiryMs = parseExpiryToMs(authConfig.jwt.refreshTokenExpiry);

    await authRepo.createRefreshToken(
      {
        sessionId: session.id,
        tokenHash: newTokenHash,
        familyId: storedToken.family_id,
        generation: storedToken.generation + 1,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
      },
      client,
    );

    // Sign new access token
    const accessToken = await signAccessToken({
      userId: session.user_id,
      sessionId: session.id,
      aal: session.aal,
      amr: session.amr,
    });

    await emitEvent(BuiltInHooks.AUTH_TOKEN_REFRESHED, { sessionId: session.id });

    return {
      accessToken,
      refreshToken: newRawToken,
      expiresIn: Math.floor(parseExpiryToMs(authConfig.jwt.accessTokenExpiry) / 1000),
    };
  });
}

/**
 * Logout — revoke the current session.
 */
export async function logout(sessionId: string, ctx: RequestContext): Promise<void> {
  await withTransaction(async (client) => {
    await authRepo.revokeAllRefreshTokensForSession(sessionId, client);
    await authRepo.revokeSession(sessionId, client);
  });

  await emitEvent(BuiltInHooks.AUTH_POST_LOGOUT, { sessionId });
  await logAuditEvent(ctx, 'auth.logout', 'success', {
    targetType: 'session', targetId: sessionId,
  });
}

/**
 * Logout all sessions for a user.
 */
export async function logoutAll(userId: string, ctx: RequestContext): Promise<void> {
  await withTransaction(async (client) => {
    await authRepo.revokeAllUserSessions(userId, client);
  });

  await logAuditEvent(ctx, 'auth.logout_all', 'success', {
    targetType: 'user', targetId: userId,
  });
}

/**
 * Get current user profile with permissions and AAL level.
 */
export async function getMe(userId: string, ctx: RequestContext): Promise<any> {
  const user = await authRepo.findUserById(userId);
  if (!user) throw new NotFoundError('User');

  const { resolveEffectivePermissions } = await import('../iam/authorisation.service.js');
  const effectivePermissions = await resolveEffectivePermissions(userId);

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    status: user.status,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    aal: ctx.aal,
    permissions: effectivePermissions.map((p) => ({
      key: p.permissionKey,
      requiredAal: p.defaultRequiredAal,
      scopeType: p.scopeType,
      scopeValue: p.scopeValue,
    })),
  };
}

/**
 * Complete MFA step-up during login and issue full session tokens.
 */
export async function completeMfaLogin(
  challengeId: string,
  ctx: RequestContext,
): Promise<AuthTokenPair> {
  const challenge = await authRepo.findAuthChallengeById(challengeId);
  if (!challenge || challenge.status !== 'pending') {
    throw new InvalidTokenError();
  }
  if (isExpired(challenge.expires_at)) {
    await authRepo.updateAuthChallengeStatus(challengeId, 'expired');
    throw new InvalidTokenError();
  }

  await authRepo.updateAuthChallengeStatus(challengeId, 'completed');

  const result = await createAuthenticatedSession(
    challenge.user_id,
    2, // AAL2 — MFA verified
    ['pwd', 'mfa'],
    ctx,
  );

  await emitEvent(BuiltInHooks.AUTH_POST_LOGIN, { userId: challenge.user_id, sessionId: result.sessionId });
  await logAuditEvent(ctx, 'auth.login.mfa_completed', 'success', {
    targetType: 'user', targetId: challenge.user_id,
  });

  return result.tokens;
}

/**
 * Step-up authentication — escalate AAL of current session.
 */
export async function stepUpSession(
  sessionId: string,
  aal: number,
  amr: string[],
  ctx: RequestContext,
): Promise<AuthTokenPair> {
  await authRepo.updateSessionAAL(sessionId, aal, amr);

  const session = await authRepo.findSessionById(sessionId);
  if (!session) throw new NotFoundError('Session');

  const accessToken = await signAccessToken({
    userId: session.user_id,
    sessionId: session.id,
    aal,
    amr,
  });

  await emitEvent(BuiltInHooks.SESSION_AAL_ESCALATED, { sessionId, aal });
  await logAuditEvent(ctx, 'auth.step_up', 'success', {
    targetType: 'session', targetId: sessionId,
    metadata: { aal },
  });

  // We need a fresh refresh token too
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const refreshExpiryMs = parseExpiryToMs(authConfig.jwt.refreshTokenExpiry);

  await authRepo.createRefreshToken({
    sessionId,
    tokenHash,
    familyId: randomUUID(),
    generation: 1,
    expiresAt: new Date(Date.now() + refreshExpiryMs),
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: Math.floor(parseExpiryToMs(authConfig.jwt.accessTokenExpiry) / 1000),
  };
}

