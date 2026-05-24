import { z } from 'zod';

export const totpEnrolVerifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().length(6, 'TOTP code must be 6 digits'),
});

export const totpVerifySchema = z.object({
  code: z.string().length(6, 'TOTP code must be 6 digits'),
  challengeId: z.string().uuid().optional(),
});

export const factorIdParamSchema = z.object({
  factorId: z.string().uuid(),
});

export const webAuthnRegisterOptionsSchema = z.object({
  friendlyName: z.string().max(100).optional(),
});

export const webAuthnRegisterVerifySchema = z.object({
  factorId: z.string().uuid(),
  challengeId: z.string().uuid(),
  credential: z.any(), // Raw WebAuthn response — validated by @simplewebauthn lib
});

export const webAuthnAuthVerifySchema = z.object({
  challengeId: z.string().uuid(),
  credential: z.any(), // Raw WebAuthn response
});

export const recoveryCodeSchema = z.object({
  code: z.string().min(1, 'Recovery code is required'),
  challengeId: z.string().uuid().optional(),
});

export type TotpEnrolVerifyInput = z.infer<typeof totpEnrolVerifySchema>;
export type TotpVerifyInput = z.infer<typeof totpVerifySchema>;
export type RecoveryCodeInput = z.infer<typeof recoveryCodeSchema>;

