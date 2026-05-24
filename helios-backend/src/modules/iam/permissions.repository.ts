import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';

export interface PermissionRow {
  id: string;
  key: string;
  display_name: string | null;
  description: string | null;
  default_required_aal: number;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface RolePermissionRow {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: Date;
}

export async function createPermission(
  data: { key: string; displayName?: string; description?: string; defaultRequiredAal?: number },
  client?: PoolClient,
): Promise<PermissionRow> {
  const sql = `
    INSERT INTO iam_permissions (key, display_name, description, default_required_aal)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const params = [data.key, data.displayName || null, data.description || null, data.defaultRequiredAal ?? 1];
  const result = client
    ? await client.query<PermissionRow>(sql, params)
    : await query<PermissionRow>(sql, params);
  return result.rows[0];
}

export async function findPermissionById(id: string): Promise<PermissionRow | null> {
  const result = await query<PermissionRow>('SELECT * FROM iam_permissions WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findPermissionByKey(key: string): Promise<PermissionRow | null> {
  const result = await query<PermissionRow>('SELECT * FROM iam_permissions WHERE key = $1', [key]);
  return result.rows[0] ?? null;
}

export async function listPermissions(): Promise<PermissionRow[]> {
  const result = await query<PermissionRow>('SELECT * FROM iam_permissions ORDER BY key');
  return result.rows;
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
  client?: PoolClient,
): Promise<RolePermissionRow> {
  const sql = `
    INSERT INTO iam_role_permissions (role_id, permission_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  const result = client
    ? await client.query<RolePermissionRow>(sql, [roleId, permissionId])
    : await query<RolePermissionRow>(sql, [roleId, permissionId]);
  return result.rows[0];
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string,
  client?: PoolClient,
): Promise<void> {
  const sql = 'DELETE FROM iam_role_permissions WHERE role_id = $1 AND permission_id = $2';
  if (client) await client.query(sql, [roleId, permissionId]);
  else await query(sql, [roleId, permissionId]);
}

export async function findPermissionsByRoleId(roleId: string): Promise<PermissionRow[]> {
  const sql = `
    SELECT p.* FROM iam_permissions p
    JOIN iam_role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = $1
    ORDER BY p.key
  `;
  const result = await query<PermissionRow>(sql, [roleId]);
  return result.rows;
}

/**
 * Resolve all permissions for a set of role IDs (including inherited roles).
 */
export async function findPermissionsByRoleIds(roleIds: string[]): Promise<PermissionRow[]> {
  if (roleIds.length === 0) return [];
  const placeholders = roleIds.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `
    SELECT DISTINCT p.* FROM iam_permissions p
    JOIN iam_role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id IN (${placeholders})
    ORDER BY p.key
  `;
  const result = await query<PermissionRow>(sql, roleIds);
  return result.rows;
}

