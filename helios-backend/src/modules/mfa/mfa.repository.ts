import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';
import type { MfaFactorRow, TotpCredentialRow, WebAuthnCredentialRow, RecoveryCodeRow } from './mfa.types.js';

// ═══════════════════════════════════════════════════════
// MFA FACTORS (generic)
// ═══════════════════════════════════════════════════════

export async function createMfaFactor(
  data: { userId: string; factorType: string; friendlyName?: string },
  client?: PoolClient,
): Promise<MfaFactorRow> {
  const sql = `
    INSERT INTO iam_mfa_factors (user_id, factor_type, friendly_name)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = client
    ? await client.query<MfaFactorRow>(sql, [data.userId, data.factorType, data.friendlyName || null])
    : await query<MfaFactorRow>(sql, [data.userId, data.factorType, data.friendlyName || null]);
  return result.rows[0];
}

export async function findMfaFactorsByUserId(userId: string, client?: PoolClient): Promise<MfaFactorRow[]> {
  const sql = 'SELECT * FROM iam_mfa_factors WHERE user_id = $1 ORDER BY created_at';
  const result = client
    ? await client.query<MfaFactorRow>(sql, [userId])
    : await query<MfaFactorRow>(sql, [userId]);
  return result.rows;
}

export async function findVerifiedMfaFactors(userId: string, client?: PoolClient): Promise<MfaFactorRow[]> {
  const sql = "SELECT * FROM iam_mfa_factors WHERE user_id = $1 AND is_verified = true AND factor_type != 'recovery'";
  const result = client
    ? await client.query<MfaFactorRow>(sql, [userId])
    : await query<MfaFactorRow>(sql, [userId]);
  return result.rows;
}

export async function findMfaFactorById(factorId: string, client?: PoolClient): Promise<MfaFactorRow | null> {
  const sql = 'SELECT * FROM iam_mfa_factors WHERE id = $1';
  const result = client
    ? await client.query<MfaFactorRow>(sql, [factorId])
    : await query<MfaFactorRow>(sql, [factorId]);
  return result.rows[0] ?? null;
}

export async function verifyMfaFactor(factorId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_mfa_factors SET is_verified = true, updated_at = now() WHERE id = $1';
  if (client) await client.query(sql, [factorId]);
  else await query(sql, [factorId]);
}

export async function deleteMfaFactor(factorId: string, client?: PoolClient): Promise<void> {
  const sql = 'DELETE FROM iam_mfa_factors WHERE id = $1';
  if (client) await client.query(sql, [factorId]);
  else await query(sql, [factorId]);
}

// ═══════════════════════════════════════════════════════
// TOTP CREDENTIALS
// ═══════════════════════════════════════════════════════

export async function createTotpCredential(
  data: { factorId: string; userId: string; encryptedSecret: string; algorithm: string; digits: number; period: number },
  client?: PoolClient,
): Promise<TotpCredentialRow> {
  const sql = `
    INSERT INTO iam_totp_credentials (factor_id, user_id, encrypted_secret, algorithm, digits, period)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const params = [data.factorId, data.userId, data.encryptedSecret, data.algorithm, data.digits, data.period];
  const result = client
    ? await client.query<TotpCredentialRow>(sql, params)
    : await query<TotpCredentialRow>(sql, params);
  return result.rows[0];
}

export async function findTotpByFactorId(factorId: string, client?: PoolClient): Promise<TotpCredentialRow | null> {
  const sql = 'SELECT * FROM iam_totp_credentials WHERE factor_id = $1';
  const result = client
    ? await client.query<TotpCredentialRow>(sql, [factorId])
    : await query<TotpCredentialRow>(sql, [factorId]);
  return result.rows[0] ?? null;
}

export async function findTotpByUserId(userId: string, client?: PoolClient): Promise<TotpCredentialRow | null> {
  const sql = 'SELECT * FROM iam_totp_credentials WHERE user_id = $1';
  const result = client
    ? await client.query<TotpCredentialRow>(sql, [userId])
    : await query<TotpCredentialRow>(sql, [userId]);
  return result.rows[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// WEBAUTHN CREDENTIALS
// ═══════════════════════════════════════════════════════

export async function createWebAuthnCredential(
  data: {
    factorId: string;
    userId: string;
    credentialId: string;
    publicKey: Buffer;
    counter: number;
    deviceType: string | null;
    backedUp: boolean;
    transports: string[] | null;
  },
  client?: PoolClient,
): Promise<WebAuthnCredentialRow> {
  const sql = `
    INSERT INTO iam_webauthn_credentials
      (factor_id, user_id, credential_id, public_key, counter, device_type, backed_up, transports)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const params = [
    data.factorId, data.userId, data.credentialId, data.publicKey,
    data.counter, data.deviceType, data.backedUp, data.transports,
  ];
  const result = client
    ? await client.query<WebAuthnCredentialRow>(sql, params)
    : await query<WebAuthnCredentialRow>(sql, params);
  return result.rows[0];
}

export async function findWebAuthnByUserId(userId: string, client?: PoolClient): Promise<WebAuthnCredentialRow[]> {
  const sql = 'SELECT * FROM iam_webauthn_credentials WHERE user_id = $1';
  const result = client
    ? await client.query<WebAuthnCredentialRow>(sql, [userId])
    : await query<WebAuthnCredentialRow>(sql, [userId]);
  return result.rows;
}

export async function findWebAuthnByCredentialId(credentialId: string, client?: PoolClient): Promise<WebAuthnCredentialRow | null> {
  const sql = 'SELECT * FROM iam_webauthn_credentials WHERE credential_id = $1';
  const result = client
    ? await client.query<WebAuthnCredentialRow>(sql, [credentialId])
    : await query<WebAuthnCredentialRow>(sql, [credentialId]);
  return result.rows[0] ?? null;
}

export async function updateWebAuthnCounter(credentialId: string, counter: number, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_webauthn_credentials SET counter = $1 WHERE credential_id = $2';
  if (client) await client.query(sql, [counter, credentialId]);
  else await query(sql, [counter, credentialId]);
}

// ═══════════════════════════════════════════════════════
// RECOVERY CODES
// ═══════════════════════════════════════════════════════

export async function createRecoveryCodes(
  factorId: string,
  userId: string,
  codeHashes: string[],
  client?: PoolClient,
): Promise<void> {
  const values = codeHashes
    .map((_, i) => `($1, $2, $${i + 3})`)
    .join(', ');
  const sql = `INSERT INTO iam_recovery_codes (factor_id, user_id, code_hash) VALUES ${values}`;
  const params = [factorId, userId, ...codeHashes];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}

export async function findUnusedRecoveryCodes(userId: string, client?: PoolClient): Promise<RecoveryCodeRow[]> {
  const sql = 'SELECT * FROM iam_recovery_codes WHERE user_id = $1 AND used_at IS NULL';
  const result = client
    ? await client.query<RecoveryCodeRow>(sql, [userId])
    : await query<RecoveryCodeRow>(sql, [userId]);
  return result.rows;
}

export async function markRecoveryCodeUsed(codeId: string, client?: PoolClient): Promise<void> {
  const sql = 'UPDATE iam_recovery_codes SET used_at = now() WHERE id = $1';
  if (client) await client.query(sql, [codeId]);
  else await query(sql, [codeId]);
}

export async function deleteRecoveryCodesByUserId(userId: string, client?: PoolClient): Promise<void> {
  const sql = 'DELETE FROM iam_recovery_codes WHERE user_id = $1';
  if (client) await client.query(sql, [userId]);
  else await query(sql, [userId]);
}

