import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { authConfig } from '../../config/auth.config.js';
import { randomBytes, createHash } from 'node:crypto';
import { InvalidTokenError, TokenExpiredError } from '../errors/auth-errors.js';

export interface AccessTokenClaims {
  sub: string;     // user ID
  sid: string;     // session ID
  jti: string;     // unique token ID
  aal: number;     // authenticator assurance level (1, 2, 3)
  amr: string[];   // authentication methods reference
  iss: string;     // issuer
  aud: string;     // audience
  iat: number;     // issued at (timestamp)
  exp: number;     // expiration time (timestamp)
}

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  aal: number;
  amr: string[];
}

let signingKey: Uint8Array | null = null;

function getSigningKey(): Uint8Array {
  if (!signingKey) {
    signingKey = new TextEncoder().encode(authConfig.jwt.signingKey);
  }
  return signingKey;
}

function generateJti(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Sign an access token JWT.
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const key = getSigningKey();
  return new SignJWT({
    sid: payload.sessionId,
    aal: payload.aal,
    amr: payload.amr,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setJti(generateJti())
    .setIssuer(authConfig.jwt.issuer)
    .setAudience(authConfig.jwt.audience)
    .setIssuedAt()
    .setExpirationTime(authConfig.jwt.accessTokenExpiry)
    .sign(key);
}

/**
 * Verify and decode an access token.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const key = getSigningKey();
    const { payload } = await jwtVerify(token, key, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });

    return {
      sub: payload.sub!,
      sid: payload.sid as string,
      jti: payload.jti!,
      aal: payload.aal as number,
      amr: payload.amr as string[],
      iss: payload.iss!,
      aud: payload.aud as string,
      iat: payload.iat!,
      exp: payload.exp!,
    };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
}

/**
 * Generate an opaque refresh token (random bytes).
 */
export function generateRefreshToken(): string {
  return randomBytes(authConfig.session.refreshTokenBytes).toString('hex');
}

/**
 * Hash a refresh token for storage (SHA-256).
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Parse an expiry string like "15m", "7d", "1h" into milliseconds.
 */
export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

// TODO: Future — expose JWKS endpoint for inter-service token verification
// export async function getJWKS(): Promise<JSONWebKeySet> { ... }

