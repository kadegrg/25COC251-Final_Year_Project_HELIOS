import { ConflictError, NotFoundError } from '../../core/errors/app-error.js';
import * as rolesRepo from './roles.repository.js';
import { logAuditEvent } from '../audit/audit.service.js';
import type { RequestContext } from '../../types/request-context.js';
import type { CreateRoleInput, UpdateRoleInput } from './iam.schemas.js';

export async function createRole(input: CreateRoleInput, ctx: RequestContext) {
  const existing = await rolesRepo.findRoleByName(input.name);
  if (existing) throw new ConflictError('Role name already exists');

  const role = await rolesRepo.createRole({
    name: input.name,
    displayName: input.displayName,
    description: input.description,
  });

  await logAuditEvent(ctx, 'iam.role.created', 'success', {
    targetType: 'role',
    targetId: role.id,
  });

  return role;
}

export async function getRole(roleId: string) {
  const role = await rolesRepo.findRoleById(roleId);
  if (!role) throw new NotFoundError('Role');
  return role;
}

export async function listRoles() {
  return rolesRepo.listRoles();
}

export async function updateRole(roleId: string, input: UpdateRoleInput, ctx: RequestContext) {
  const role = await rolesRepo.updateRole(roleId, {
    displayName: input.displayName,
    description: input.description,
  });
  if (!role) throw new NotFoundError('Role');

  await logAuditEvent(ctx, 'iam.role.updated', 'success', {
    targetType: 'role',
    targetId: roleId,
    metadata: input,
  });

  return role;
}

