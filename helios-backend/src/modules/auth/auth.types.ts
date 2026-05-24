export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginResult {
  type: 'authenticated' | 'mfa_required';
  tokens?: AuthTokenPair;
  challengeId?: string;
  availableMethods?: string[];
  sessionId?: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  status: string;
  aal: number;
  amr: string[];
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenRow {
  id: string;
  session_id: string;
  token_hash: string;
  family_id: string;
  generation: number;
  is_revoked: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  status: string;
  email_verified_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordCredentialRow {
  id: string;
  user_id: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: Date | null;
  last_changed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthChallengeRow {
  id: string;
  session_id: string | null;
  user_id: string;
  challenge_type: string;
  challenge_data: Record<string, unknown>;
  status: string;
  expires_at: Date;
  created_at: Date;
}

