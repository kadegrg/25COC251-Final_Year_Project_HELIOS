import { z } from 'zod';
import { env } from '../../config/env.js';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  // Can also come from cookie — handled in controller
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const stepUpSchema = z.object({
  factorType: z.enum(['totp', 'webauthn', 'recovery']),
  code: z.string().optional(),
  // WebAuthn uses its own authenticate flow, then calls step-up
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type StepUpInput = z.infer<typeof stepUpSchema>;

