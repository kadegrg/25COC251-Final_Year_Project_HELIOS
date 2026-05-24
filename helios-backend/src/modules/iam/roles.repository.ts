import { query } from '../../db/index.js';
import type { PoolClient } from '../../db/index.js';

export interface RoleRow {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_system: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface RoleAssignmentRow {
  id: string;
  user_id: string;
  role_id: string;
  scope_type: string;
  scope_value: string | null;
  granted_by: string | null;
  expires_at: Date | null;
  created_at: Date;
}

export async function createRole(
  data: { name: string; displayName?: string; description?: string; isSystem?: boolean },
  client?: PoolClient,
): Promise<RoleRow> {
  const sql = `
    INSERT INTO iam_roles (name, display_name, description, is_system)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const params = [data.name, data.displayName || null, data.description || null, data.isSystem ?? false];
  const result = client
    ? await client.query<RoleRow>(sql, params)
    : await query<RoleRow>(sql, params);
  return result.rows[0];
}

export async function findRoleById(id: string, client?: PoolClient): Promise<RoleRow | null> {
  const sql = 'SELECT * FROM iam_roles WHERE id = $1';
  const result = client
    ? await client.query<RoleRow>(sql, [id])
    : await query<RoleRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export async function findRoleByName(name: string, client?: PoolClient): Promise<RoleRow | null> {
  const sql = 'SELECT * FROM iam_roles WHERE name = $1';
  const result = client
    ? await client.query<RoleRow>(sql, [name])
    : await query<RoleRow>(sql, [name]);
  return result.rows[0] ?? null;
}

export async function listRoles(): Promise<RoleRow[]> {
  const result = await query<RoleRow>('SELECT * FROM iam_roles ORDER BY name');
  return result.rows;
}

export async function updateRole(
  roleId: string,
  data: { displayName?: string; description?: string },
  client?: PoolClient,
): Promise<RoleRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (data.displayName !== undefined) {
    sets.push(`display_name = $${paramIdx++}`);
    params.push(data.displayName);
  }
  if (data.description !== undefined) {
    sets.push(`description = $${paramIdx++}`);
    params.push(data.description);
  }

  if (sets.length === 0) return findRoleById(roleId);

  sets.push('updated_at = now()');
  params.push(roleId);

  const sql = `UPDATE iam_roles SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = client
    ? await client.query<RoleRow>(sql, params)
    : await query<RoleRow>(sql, params);
  return result.rows[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// ROLE INHERITANCE
// ═══════════════════════════════════════════════════════

export async function addRoleInheritance(parentRoleId: string, childRoleId: string, client?: PoolClient): Promise<void> {
  const sql = 'INSERT INTO iam_role_inheritance (parent_role_id, child_role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
  if (client) await client.query(sql, [parentRoleId, childRoleId]);
  else await query(sql, [parentRoleId, childRoleId]);
}

export async function getChildRoleIds(roleId: string): Promise<string[]> {
  // Recursive CTE to resolve full inheritance chain
  const sql = `
    WITH RECURSIVE role_tree AS (
      SELECT child_role_id FROM iam_role_inheritance WHERE parent_role_id = $1
      UNION ALL
      SELECT ri.child_role_id
      FROM iam_role_inheritance ri
      JOIN role_tree rt ON ri.parent_role_id = rt.child_role_id
    )
    SELECT DISTINCT child_role_id FROM role_tree
  `;
  const result = await query<{ child_role_id: string }>(sql, [roleId]);
  return result.rows.map((r) => r.child_role_id);
}

// ═══════════════════════════════════════════════════════
// USER ROLE ASSIGNMENTS
// ═══════════════════════════════════════════════════════

export async function assignRoleToUser(
  data: { userId: string; roleId: string; scopeType: string; scopeValue?: string; grantedBy?: string; expiresAt?: Date },
  client?: PoolClient,
): Promise<RoleAssignmentRow> {
  const sql = `
    INSERT INTO iam_user_role_assignments (user_id, role_id, scope_type, scope_value, granted_by, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const params = [
    data.userId, data.roleId, data.scopeType,
    data.scopeValue || null, data.grantedBy || null, data.expiresAt || null,
  ];
  const result = client
    ? await client.query<RoleAssignmentRow>(sql, params)
    : await query<RoleAssignmentRow>(sql, params);
  return result.rows[0];
}

export async function removeRoleAssignment(assignmentId: string, client?: PoolClient): Promise<void> {
  const sql = 'DELETE FROM iam_user_role_assignments WHERE id = $1';
  if (client) await client.query(sql, [assignmentId]);
  else await query(sql, [assignmentId]);
}

export async function findRoleAssignmentsByUserId(userId: string, client?: PoolClient): Promise<RoleAssignmentRow[]> {
  const sql = `
    SELECT * FROM iam_user_role_assignments
    WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at
  `;
  const result = client
    ? await client.query<RoleAssignmentRow>(sql, [userId])
    : await query<RoleAssignmentRow>(sql, [userId]);
  return result.rows;
}

