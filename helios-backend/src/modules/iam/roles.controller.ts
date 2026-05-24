import type { Request, Response, NextFunction } from 'express';
import * as rolesService from './roles.service.js';
import { sendSuccess, sendCreated } from '../../core/http/response.js';

export async function listRolesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await rolesService.listRoles();
    sendSuccess(res, roles);
  } catch (err) {
    next(err);
  }
}

export async function createRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await rolesService.createRole(req.body, req.ctx);
    sendCreated(res, role);
  } catch (err) {
    next(err);
  }
}

export async function updateRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await rolesService.updateRole(req.params.roleId as string, req.body, req.ctx);
    sendSuccess(res, role);
  } catch (err) {
    next(err);
  }
}


