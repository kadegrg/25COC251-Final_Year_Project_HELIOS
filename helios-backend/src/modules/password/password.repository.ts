import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export async function updatePasswordHash(
  userId: string,
  newHash: string,
  client?: PoolClient,
): Promise<void> {
  const sql = `
    UPDATE iam_password_credentials
    SET password_hash = $1, last_changed_at = now(), failed_attempts = 0, locked_until = NULL, updated_at = now()
    WHERE user_id = $2
  `;
  if (client) await client.query(sql, [newHash, userId]);
  else await query(sql, [newHash, userId]);
}

// Password reset tokens are stored in iam_auth_challenges with type 'password_reset'