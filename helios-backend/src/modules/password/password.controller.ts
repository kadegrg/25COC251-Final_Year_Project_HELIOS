import type { Request, Response, NextFunction } from 'express';
import * as passwordService from './password.service.js';
import { sendSuccess, sendNoContent } from '../../core/http/response.js';

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    await passwordService.changePassword(req.ctx.userId!, currentPassword, newPassword, req.ctx);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await passwordService.forgotPassword(req.body.email, req.ctx);
    // Always return success to prevent enumeration
    sendSuccess(res, { message: 'If an account exists, a reset email has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    await passwordService.resetPassword(token, newPassword, req.ctx);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

