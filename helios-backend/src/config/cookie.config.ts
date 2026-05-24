import { env } from './env.js';
import type { CookieOptions } from 'express';

export const cookieConfig = {
  refreshToken: {
    name: 'helios_refresh',
    options: {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      domain: env.COOKIE_DOMAIN,
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    } satisfies CookieOptions,
  },
  csrfToken: {
    name: 'helios_csrf',
    options: {
      httpOnly: false,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      domain: env.COOKIE_DOMAIN,
      path: '/',
    } satisfies CookieOptions,
  },
} as const;

