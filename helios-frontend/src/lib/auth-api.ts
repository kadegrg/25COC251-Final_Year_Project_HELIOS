/** Auth API wrapper — all endpoints under /api/v1/auth */

import { api } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  TokenResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  StepUpRequest,
  TotpEnrolStartResponse,
  TotpEnrolVerifyRequest,
  TotpVerifyRequest,
  WebAuthnRegisterOptionsRequest,
  WebAuthnRegisterOptionsResponse,
  WebAuthnRegisterVerifyRequest,
  WebAuthnAuthenticateOptionsRequest,
  WebAuthnAuthenticateOptionsResponse,
  WebAuthnAuthenticateVerifyRequest,
  RecoveryUseRequest,
  RecoveryRegenerateResponse,
  MfaFactor,
  Session,
} from '@/types/auth.types';

function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

// Auth core
export const authApi = {
  login: (body: LoginRequest) =>
    api.post('/v1/auth/login', body).then((r) => unwrap<LoginResponse>(r)),

  refresh: () =>
    api.post('/v1/auth/refresh').then((r) => unwrap<TokenResponse>(r)),

  logout: () => api.post('/v1/auth/logout'),

  logoutAll: () => api.post('/v1/auth/logout-all'),

  me: () => api.get('/v1/auth/me').then((r) => unwrap<MeResponse>(r)),

  stepUp: (body: StepUpRequest) =>
    api.post('/v1/auth/step-up', body).then((r) => unwrap<TokenResponse>(r)),
};

// Password
export const passwordApi = {
  change: (body: ChangePasswordRequest) =>
    api.post('/v1/auth/password/change', body),

  forgot: (body: ForgotPasswordRequest) =>
    api.post('/v1/auth/password/forgot', body),

  reset: (body: ResetPasswordRequest) =>
    api.post('/v1/auth/password/reset', body),
};

// MFA — TOTP
export const totpApi = {
  enrolStart: () =>
    api.post('/v1/auth/mfa/totp/enrol/start').then((r) => unwrap<TotpEnrolStartResponse>(r)),

  enrolVerify: (body: TotpEnrolVerifyRequest) =>
    api.post('/v1/auth/mfa/totp/enrol/verify', body).then((r) => r.data),

  verify: (body: TotpVerifyRequest) =>
    api.post('/v1/auth/mfa/totp/verify', body).then((r) => unwrap<TokenResponse & { verified?: boolean }>(r)),

  remove: (factorId: string) =>
    api.delete(`/v1/auth/mfa/totp/${factorId}`),
};

// MFA — WebAuthn
export const webAuthnApi = {
  registerOptions: (body: WebAuthnRegisterOptionsRequest) =>
    api.post('/v1/auth/mfa/webauthn/register/options', body).then((r) => unwrap<WebAuthnRegisterOptionsResponse>(r)),

  registerVerify: (body: WebAuthnRegisterVerifyRequest) =>
    api.post('/v1/auth/mfa/webauthn/register/verify', body).then((r) => r.data),

  authenticateOptions: (body: WebAuthnAuthenticateOptionsRequest) =>
    api.post('/v1/auth/mfa/webauthn/authenticate/options', body).then((r) => unwrap<WebAuthnAuthenticateOptionsResponse>(r)),

  authenticateVerify: (body: WebAuthnAuthenticateVerifyRequest) =>
    api.post('/v1/auth/mfa/webauthn/authenticate/verify', body).then((r) => unwrap<TokenResponse & { verified?: boolean }>(r)),

  remove: (factorId: string) =>
    api.delete(`/v1/auth/mfa/webauthn/${factorId}`),
};

// MFA — Recovery
export const recoveryApi = {
  regenerate: () =>
    api.post('/v1/auth/mfa/recovery/regenerate').then((r) => unwrap<RecoveryRegenerateResponse>(r)),

  use: (body: RecoveryUseRequest) =>
    api.post('/v1/auth/mfa/recovery/use', body).then((r) => unwrap<TokenResponse & { verified?: boolean }>(r)),
};

// MFA — Factors
export const factorsApi = {
  list: () =>
    api.get('/v1/auth/mfa/factors').then((r) => unwrap<MfaFactor[]>(r)),
};

// Sessions
export const sessionsApi = {
  list: () =>
    api.get('/v1/auth/sessions').then((r) => unwrap<Session[]>(r)),

  revoke: (sessionId: string) =>
    api.delete(`/v1/auth/sessions/${sessionId}`),
};

// Health
export const healthApi = {
  check: () =>
    api.get('/v1/health').then((r) => r.data as { status: string; timestamp: string }),
};

