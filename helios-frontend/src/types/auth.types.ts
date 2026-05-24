/** Auth module types */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseAuthenticated {
  type: 'authenticated';
  accessToken: string;
  expiresIn: number;
  sessionId: string;
}

export interface LoginResponseMfaRequired {
  type: 'mfa_required';
  challengeId: string;
  availableMethods: MfaMethod[];
}

export type LoginResponse = LoginResponseAuthenticated | LoginResponseMfaRequired;

export type MfaMethod = 'totp' | 'webauthn' | 'recovery';

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  aal: number;
  permissions: Permission[];
}

export interface Permission {
  key: string;
  requiredAal: number;
  scopeType: string;
  scopeValue: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface StepUpRequest {
  factorType: MfaMethod;
  code?: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

// MFA types

export interface TotpEnrolStartResponse {
  factorId: string;
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

export interface TotpEnrolVerifyRequest {
  factorId: string;
  code: string;
}

export interface TotpVerifyRequest {
  code: string;
  challengeId?: string;
}

export interface WebAuthnRegisterOptionsRequest {
  friendlyName?: string;
}

export interface WebAuthnRegisterOptionsResponse {
  options: any; // PublicKeyCredentialCreationOptions
  factorId: string;
  challengeId: string;
}

export interface WebAuthnRegisterVerifyRequest {
  factorId: string;
  challengeId: string;
  credential: any;
}

export interface WebAuthnAuthenticateOptionsRequest {
  challengeId?: string;
  userId?: string;
}

export interface WebAuthnAuthenticateOptionsResponse {
  options: any; // PublicKeyCredentialRequestOptions
  challengeId: string;
}

export interface WebAuthnAuthenticateVerifyRequest {
  challengeId: string;
  credential: any;
}

export interface RecoveryUseRequest {
  code: string;
  challengeId?: string;
}

export interface MfaFactor {
  id: string;
  factorType: MfaMethod;
  friendlyName: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  remainingCodes?: number;
  webauthn?: {
    credentialId: string;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
    createdAt: string;
  };
}

export interface RecoveryRegenerateResponse {
  codes: string[];
}

// Sessions

export interface Session {
  id: string;
  status: string;
  aal: number;
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
  expiresAt: string;
  createdAt: string;
}

