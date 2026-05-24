import { z } from 'zod';
import { config } from 'dotenv';

config(); // load .env into process.env

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  DATABASE_URL: z.string().url(),
  DB_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),

  JWT_ISSUER: z.string().default('helios'),
  JWT_AUDIENCE: z.string().default('helios-api'),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  JWT_SIGNING_KEY: z.string().min(32),

  ENCRYPTION_KEY: z.string().min(32),

  PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).default(10),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().int().min(1).default(15),

  TOTP_ISSUER: z.string().default('HELIOS'),
  TOTP_ALGORITHM: z.enum(['sha1', 'sha256', 'sha512']).default('sha1'),
  TOTP_DIGITS: z.coerce.number().int().min(6).max(8).default(6),
  TOTP_PERIOD: z.coerce.number().int().min(30).max(60).default(30),

  WEBAUTHN_RP_NAME: z.string().default('HELIOS'),
  WEBAUTHN_RP_ID: z.string().default('localhost'),
  WEBAUTHN_ORIGIN: z.string().url().default('http://localhost:3000'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_PATH: z.string().default('/'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().default(900_000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().default(10),
  RATE_LIMIT_MFA_WINDOW_MS: z.coerce.number().int().default(300_000),
  RATE_LIMIT_MFA_MAX: z.coerce.number().int().default(5),
  RATE_LIMIT_API_WINDOW_MS: z.coerce.number().int().default(60_000),
  RATE_LIMIT_API_MAX: z.coerce.number().int().default(100),

  SITE_RESOLUTION_MODE: z.enum(['hybrid', 'path', 'host']).default('hybrid'),
  BASE_DOMAIN: z.string().default('api.helios.kadegrg.dev'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();


