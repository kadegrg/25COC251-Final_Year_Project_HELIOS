import type { Request, Response, NextFunction } from 'express';
import * as permissionsService from './permissions.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/http/response.js';

export async function listPermissionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissions = await permissionsService.listPermissions();
    sendSuccess(res, permissions);
  } catch (err) {
    next(err);
  }
}

export async function createPermissionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permission = await permissionsService.createPermission(req.body, req.ctx);
    sendCreated(res, permission);
  } catch (err) {
    next(err);
  }
}

export async function assignPermissionToRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleId = req.params.roleId as string;
    const { permissionId } = req.body;
    const result = await permissionsService.assignPermissionToRole(roleId, permissionId, req.ctx);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function removePermissionFromRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleId = req.params.roleId as string;
    const permissionId = req.params.permissionId as string;
    await permissionsService.removePermissionFromRole(roleId, permissionId, req.ctx);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
