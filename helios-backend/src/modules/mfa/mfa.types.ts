export type MfaFactorType = 'totp' | 'webauthn' | 'recovery';

export interface MfaFactorRow {
  id: string;
  user_id: string;
  factor_type: MfaFactorType;
  friendly_name: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TotpCredentialRow {
  id: string;
  factor_id: string;
  user_id: string;
  encrypted_secret: string;
  algorithm: string;
  digits: number;
  period: number;
  created_at: Date;
}

export interface WebAuthnCredentialRow {
  id: string;
  factor_id: string;
  user_id: string;
  credential_id: string;
  public_key: Buffer;
  counter: number;
  device_type: string | null;
  backed_up: boolean;
  transports: string[] | null;
  created_at: Date;
}

export interface RecoveryCodeRow {
  id: string;
  factor_id: string;
  user_id: string;
  code_hash: string;
  used_at: Date | null;
  created_at: Date;
}

