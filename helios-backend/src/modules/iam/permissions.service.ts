import { ConflictError } from '../../core/errors/app-error.js';
import * as permissionsRepo from './permissions.repository.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';
import type { RequestContext } from '../../types/request-context.js';
import type { CreatePermissionInput } from './iam.schemas.js';

export async function createPermission(input: CreatePermissionInput, ctx: RequestContext) {
  const existing = await permissionsRepo.findPermissionByKey(input.key);
  if (existing) throw new ConflictError('Permission key already exists');

  const permission = await permissionsRepo.createPermission({
    key: input.key,
    displayName: input.displayName,
    description: input.description,
    defaultRequiredAal: input.defaultRequiredAal,
  });

  await logAuditEvent(ctx, 'iam.permission.created', 'success', {
    targetType: 'permission',
    targetId: permission.id,
  });

  return permission;
}

export async function listPermissions() {
  return permissionsRepo.listPermissions();
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
  ctx: RequestContext,
) {
  const result = await permissionsRepo.assignPermissionToRole(roleId, permissionId);

  await emitEvent(BuiltInHooks.PERMISSION_CHANGED, { roleId, permissionId, action: 'assigned' });
  await logAuditEvent(ctx, 'iam.role.permission_assigned', 'success', {
    targetType: 'role',
    targetId: roleId,
    metadata: { permissionId },
  });

  return result;
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string,
  ctx: RequestContext,
) {
  await permissionsRepo.removePermissionFromRole(roleId, permissionId);

  await emitEvent(BuiltInHooks.PERMISSION_CHANGED, { roleId, permissionId, action: 'removed' });
  await logAuditEvent(ctx, 'iam.role.permission_removed', 'success', {
    targetType: 'role',
    targetId: roleId,
    metadata: { permissionId },
  });
}

