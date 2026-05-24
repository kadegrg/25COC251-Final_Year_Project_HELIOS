import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';
import type { UserRow } from '../auth/auth.types.js';

export async function createUser(
  data: { email: string; username: string; displayName?: string; status?: string },
  client?: PoolClient,
): Promise<UserRow> {
  const sql = `
    INSERT INTO iam_users (email, username, display_name, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const params = [data.email, data.username, data.displayName || null, data.status || 'pending'];
  const result = client
    ? await client.query<UserRow>(sql, params)
    : await query<UserRow>(sql, params);
  return result.rows[0];
}

export async function createPasswordCredential(
  userId: string,
  passwordHash: string,
  client?: PoolClient,
): Promise<void> {
  const sql = `
    INSERT INTO iam_password_credentials (user_id, password_hash)
    VALUES ($1, $2)
  `;
  if (client) await client.query(sql, [userId, passwordHash]);
  else await query(sql, [userId, passwordHash]);
}

export async function findUserById(id: string, client?: PoolClient): Promise<UserRow | null> {
  const sql = 'SELECT * FROM iam_users WHERE id = $1';
  const result = client
    ? await client.query<UserRow>(sql, [id])
    : await query<UserRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string, client?: PoolClient): Promise<UserRow | null> {
  const sql = 'SELECT * FROM iam_users WHERE email = $1';
  const result = client
    ? await client.query<UserRow>(sql, [email])
    : await query<UserRow>(sql, [email]);
  return result.rows[0] ?? null;
}

export async function findUserByUsername(username: string, client?: PoolClient): Promise<UserRow | null> {
  const sql = 'SELECT * FROM iam_users WHERE username = $1';
  const result = client
    ? await client.query<UserRow>(sql, [username])
    : await query<UserRow>(sql, [username]);
  return result.rows[0] ?? null;
}

export async function listUsers(
  filters: { status?: string; limit: number; offset: number },
): Promise<{ users: UserRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(filters.status);
  }

  // Exclude deleted by default
  conditions.push(`status != 'deleted'`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM iam_users ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query<UserRow>(
    `SELECT * FROM iam_users ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, filters.limit, filters.offset],
  );

  return { users: result.rows, total };
}

export async function updateUser(
  userId: string,
  data: { displayName?: string; status?: string; metadata?: Record<string, unknown> },
  client?: PoolClient,
): Promise<UserRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (data.displayName !== undefined) {
    sets.push(`display_name = $${paramIdx++}`);
    params.push(data.displayName);
  }
  if (data.status !== undefined) {
    sets.push(`status = $${paramIdx++}`);
    params.push(data.status);
  }
  if (data.metadata !== undefined) {
    sets.push(`metadata = $${paramIdx++}`);
    params.push(JSON.stringify(data.metadata));
  }

  if (sets.length === 0) return findUserById(userId, client);

  sets.push('updated_at = now()');
  params.push(userId);

  const sql = `UPDATE iam_users SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = client
    ? await client.query<UserRow>(sql, params)
    : await query<UserRow>(sql, params);
  return result.rows[0] ?? null;
}

