import { findRoleAssignmentsByUserId, getChildRoleIds } from './roles.repository.js';
import { findPermissionsByRoleIds, type PermissionRow } from './permissions.repository.js';

export interface EffectivePermission {
  permissionKey: string;
  permissionId: string;
  defaultRequiredAal: number;
  scopeType: string;
  scopeValue: string | null;
  roleId: string;
}

/**
 * Resolve all effective permissions for a user.
 * Steps:
 *   1. Load active role assignments for the user (including scoped assignments).
 *   2. For each assigned role, recursively resolve inherited (child) roles.
 *   3. Collect all unique role IDs.
 *   4. Load permissions for all those roles.
 *   5. Return permissions with their scope context.
 */
export async function resolveEffectivePermissions(userId: string): Promise<EffectivePermission[]> {
  // 1. Get direct role assignments
  const assignments = await findRoleAssignmentsByUserId(userId);
  if (assignments.length === 0) return [];

  // 2. Expand inherited roles
  const allRoleIds = new Set<string>();
  const roleToScope = new Map<string, { scopeType: string; scopeValue: string | null }>();

  for (const assignment of assignments) {
    allRoleIds.add(assignment.role_id);
    roleToScope.set(assignment.role_id, {
      scopeType: assignment.scope_type,
      scopeValue: assignment.scope_value,
    });

    // Resolve inherited roles
    const childIds = await getChildRoleIds(assignment.role_id);
    for (const childId of childIds) {
      allRoleIds.add(childId);
      // Inherited roles carry the same scope as the parent assignment
      if (!roleToScope.has(childId)) {
        roleToScope.set(childId, {
          scopeType: assignment.scope_type,
          scopeValue: assignment.scope_value,
        });
      }
    }
  }

  // 3. Load permissions for all roles
  const roleIdArray = Array.from(allRoleIds);
  const permissions = await findPermissionsByRoleIds(roleIdArray);

  // 4. Build effective permissions with scope context
  // We need to know which role each permission came from to attach the scope
  const effectivePerms: EffectivePermission[] = [];
  const seen = new Set<string>();

  for (const roleId of roleIdArray) {
    const scope = roleToScope.get(roleId)!;
    // Re-query per role to know which perms belong to which role
    // This is already efficient since findPermissionsByRoleIds did the join
    for (const perm of permissions) {
      const key = `${perm.key}:${scope.scopeType}:${scope.scopeValue ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      effectivePerms.push({
        permissionKey: perm.key,
        permissionId: perm.id,
        defaultRequiredAal: perm.default_required_aal,
        scopeType: scope.scopeType,
        scopeValue: scope.scopeValue,
        roleId,
      });
    }
  }

  return effectivePerms;
}

/**
 * Check whether a user has a specific permission, optionally within a scope.
 */
export async function hasPermission(
  userId: string,
  permissionKey: string,
  scope?: { siteId?: string; locationId?: string; resourceOwnerId?: string },
): Promise<{ allowed: boolean; requiredAal: number }> {
  const perms = await resolveEffectivePermissions(userId);

  const match = perms.find((p) => {
    if (p.permissionKey !== permissionKey) return false;
    if (p.scopeType === 'GLOBAL') return true;
    if (p.scopeType === 'SITE' && scope?.siteId) return p.scopeValue === scope.siteId;
    if (p.scopeType === 'LOCATION' && scope?.locationId) return p.scopeValue === scope.locationId;
    if (p.scopeType === 'OWN' && scope?.resourceOwnerId) return scope.resourceOwnerId === userId;
    return false;
  });

  if (!match) return { allowed: false, requiredAal: 1 };
  return { allowed: true, requiredAal: match.defaultRequiredAal };
}

