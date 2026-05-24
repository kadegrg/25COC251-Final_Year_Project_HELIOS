import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';
import type {
  UserRow,
  PasswordCredentialRow,
  SessionRow,
  RefreshTokenRow,
  AuthChallengeRow,
} from './auth.types.js';

// ═══════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════

export async function findUserByEmail(email: string, client?: PoolClient): Promise<UserRow | null> {
  const sql = 'SELECT * FROM iam_users WHERE email = $1';
  const result = client
    ? await client.query<UserRow>(sql, [email])
    : await query<UserRow>(sql, [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string, client?: PoolClient): Promise<UserRow | null> {
  const sql = 'SELECT * FROM iam_users WHERE id = $1';
  const result = client
    ? await client.query<UserRow>(sql, [id])
    : await query<UserRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function updateUserStatus(userId: string, status: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_users SET status = $1, updated_at = now() WHERE id = $2';
  if (client) await client.query(sql, [status, userId]);
  else await query(sql, [status, userId]);
}

// ═══════════════════════════════════════════════════════
// PASSWORD CREDENTIALS
// ═══════════════════════════════════════════════════════

export async function findPasswordByUserId(userId: string, client?: PoolClient): Promise<PasswordCredentialRow | null> {
  const sql = 'SELECT * FROM iam_password_credentials WHERE user_id = $1';
  const result = client
    ? await client.query<PasswordCredentialRow>(sql, [userId])
    : await query<PasswordCredentialRow>(sql, [userId]);
  return result.rows[0] ?? null;
}

export async function incrementFailedAttempts(userId: string, client?: PoolClient): Promise<number> {
  const sql = `
    UPDATE iam_password_credentials
    SET failed_attempts = failed_attempts + 1, updated_at = now()
    WHERE user_id = $1
    RETURNING failed_attempts
  `;
  const result = client
    ? await client.query<{ failed_attempts: number }>(sql, [userId])
    : await query<{ failed_attempts: number }>(sql, [userId]);
  return result.rows[0]?.failed_attempts ?? 0;
}

export async function resetFailedAttempts(userId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_password_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1';
  if (client) await client.query(sql, [userId]);
  else await query(sql, [userId]);
}

export async function lockAccount(userId: string, lockedUntil: Date, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_password_credentials SET locked_until = $1, updated_at = now() WHERE user_id = $2';
  if (client) await client.query(sql, [lockedUntil, userId]);
  else await query(sql, [lockedUntil, userId]);
}

// ═══════════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════════

export async function createSession(
  data: { userId: string; aal: number; amr: string[]; ipAddress: string; userAgent: string; expiresAt: Date },
  client?: PoolClient,
): Promise<SessionRow> {
  const sql = `
    INSERT INTO iam_sessions (user_id, aal, amr, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const params = [data.userId, data.aal, data.amr, data.ipAddress, data.userAgent, data.expiresAt];
  const result = client
    ? await client.query<SessionRow>(sql, params)
    : await query<SessionRow>(sql, params);
  return result.rows[0];
}

export async function findSessionById(id: string, client?: PoolClient): Promise<SessionRow | null> {
  const sql = 'SELECT * FROM iam_sessions WHERE id = $1';
  const result = client
    ? await client.query<SessionRow>(sql, [id])
    : await query<SessionRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function findSessionsByUserId(userId: string): Promise<SessionRow[]> {
  const result = await query<SessionRow>(
    "SELECT * FROM iam_sessions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC",
    [userId],
  );
  return result.rows;
}

export async function updateSessionAAL(
  sessionId: string,
  aal: number,
  amr: string[],
  client?: PoolClient,
): Promise<void> {
  const sql = 'UPDATE iam_sessions SET aal = $1, amr = $2, updated_at = now() WHERE id = $3';
  if (client) await client.query(sql, [aal, amr, sessionId]);
  else await query(sql, [aal, amr, sessionId]);
}

export async function revokeSession(sessionId: string, client?: PoolClient): Promise<void> {
  const sql = "UPDATE iam_sessions SET status = 'revoked', updated_at = now() WHERE id = $1";
  if (client) await client.query(sql, [sessionId]);
  else await query(sql, [sessionId]);
}

export async function revokeAllUserSessions(userId: string, client?: PoolClient): Promise<void> {
  const sql = "UPDATE iam_sessions SET status = 'revoked', updated_at = now() WHERE user_id = $1 AND status = 'active'";
  if (client) await client.query(sql, [userId]);
  else await query(sql, [userId]);
}

// ═══════════════════════════════════════════════════════
// REFRESH TOKENS
// ═══════════════════════════════════════════════════════

export async function createRefreshToken(
  data: { sessionId: string; tokenHash: string; familyId: string; generation: number; expiresAt: Date },
  client?: PoolClient,
): Promise<RefreshTokenRow> {
  const sql = `
    INSERT INTO iam_refresh_tokens (session_id, token_hash, family_id, generation, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const params = [data.sessionId, data.tokenHash, data.familyId, data.generation, data.expiresAt];
  const result = client
    ? await client.query<RefreshTokenRow>(sql, params)
    : await query<RefreshTokenRow>(sql, params);
  return result.rows[0];
}

export async function findRefreshTokenByHash(tokenHash: string, client?: PoolClient): Promise<RefreshTokenRow | null> {
  const sql = 'SELECT * FROM iam_refresh_tokens WHERE token_hash = $1';
  const result = client
    ? await client.query<RefreshTokenRow>(sql, [tokenHash])
    : await query<RefreshTokenRow>(sql, [tokenHash]);
  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(tokenId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_refresh_tokens SET is_revoked = true WHERE id = $1';
  if (client) await client.query(sql, [tokenId]);
  else await query(sql, [tokenId]);
}

export async function revokeRefreshTokenFamily(familyId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_refresh_tokens SET is_revoked = true WHERE family_id = $1';
  if (client) await client.query(sql, [familyId]);
  else await query(sql, [familyId]);
}

export async function revokeAllRefreshTokensForSession(sessionId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_refresh_tokens SET is_revoked = true WHERE session_id = $1';
  if (client) await client.query(sql, [sessionId]);
  else await query(sql, [sessionId]);
}

// ═══════════════════════════════════════════════════════
// AUTH CHALLENGES
// ═══════════════════════════════════════════════════════

export async function createAuthChallenge(
  data: { sessionId?: string; userId: string; challengeType: string; challengeData: Record<string, unknown>; expiresAt: Date },
  client?: PoolClient,
): Promise<AuthChallengeRow> {
  const sql = `
    INSERT INTO iam_auth_challenges (session_id, user_id, challenge_type, challenge_data, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const params = [data.sessionId || null, data.userId, data.challengeType, JSON.stringify(data.challengeData), data.expiresAt];
  const result = client
    ? await client.query<AuthChallengeRow>(sql, params)
    : await query<AuthChallengeRow>(sql, params);
  return result.rows[0];
}

export async function findAuthChallengeById(id: string, client?: PoolClient): Promise<AuthChallengeRow | null> {
  const sql = 'SELECT * FROM iam_auth_challenges WHERE id = $1';
  const result = client
    ? await client.query<AuthChallengeRow>(sql, [id])
    : await query<AuthChallengeRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function updateAuthChallengeStatus(id: string, status: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_auth_challenges SET status = $1 WHERE id = $2';
  if (client) await client.query(sql, [status, id]);
  else await query(sql, [status, id]);
}

