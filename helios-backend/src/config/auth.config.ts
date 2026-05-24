import { env } from './env.js';

export const authConfig = {
  jwt: {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
    signingKey: env.JWT_SIGNING_KEY,
  },
  password: {
    minLength: env.PASSWORD_MIN_LENGTH,
    maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
    lockoutDurationMinutes: env.LOCKOUT_DURATION_MINUTES,
  },
  totp: {
    issuer: env.TOTP_ISSUER,
    algorithm: env.TOTP_ALGORITHM,
    digits: env.TOTP_DIGITS,
    period: env.TOTP_PERIOD,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  session: {
    refreshTokenBytes: 32,
    recoveryCodeCount: 10,
    recoveryCodeLength: 8,
  },
} as const;

