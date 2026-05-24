import { env } from './env.js';

export const webAuthnConfig = {
  rpName: env.WEBAUTHN_RP_NAME,
  rpID: env.WEBAUTHN_RP_ID,
  origin: env.WEBAUTHN_ORIGIN,
  // Timeout for registration/authentication ceremonies (ms)
  timeout: 60_000,
  // Attestation preference
  attestationType: 'none' as const,
  // Authenticator selection
  authenticatorSelection: {
    residentKey: 'preferred' as const,
    userVerification: 'preferred' as const,
  },
};

