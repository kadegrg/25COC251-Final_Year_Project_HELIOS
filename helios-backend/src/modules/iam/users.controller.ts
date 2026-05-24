import type { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import * as rolesRepo from './roles.repository.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/http/response.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { emitEvent } from '../../core/plugins/hook-executor.js';
import { BuiltInHooks } from '../../core/plugins/hook-types.js';

export async function listUsersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await usersService.listUsers(page, limit);
    sendSuccess(res, result.users, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
}

export async function getUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUser(req.params.userId as string);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.createUser(req.body, req.ctx);
    sendCreated(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.updateUser(req.params.userId as string, req.body, req.ctx);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function assignRoleToUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const { roleId, scopeType, scopeValue, expiresAt } = req.body;

    const assignment = await rolesRepo.assignRoleToUser({
      userId,
      roleId,
      scopeType: scopeType || 'GLOBAL',
      scopeValue,
      grantedBy: req.ctx.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await emitEvent(BuiltInHooks.ROLE_ASSIGNED, { userId, roleId, scopeType });
    await logAuditEvent(req.ctx, 'iam.user.role_assigned', 'success', {
      targetType: 'user',
      targetId: userId,
      metadata: { roleId, scopeType, scopeValue },
    });

    sendCreated(res, assignment);
  } catch (err) {
    next(err);
  }
}

export async function removeRoleFromUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const assignmentId = req.params.assignmentId as string;

    await rolesRepo.removeRoleAssignment(assignmentId);

    await emitEvent(BuiltInHooks.ROLE_REVOKED, { userId, assignmentId });
    await logAuditEvent(req.ctx, 'iam.user.role_revoked', 'success', {
      targetType: 'user',
      targetId: userId,
      metadata: { assignmentId },
    });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
