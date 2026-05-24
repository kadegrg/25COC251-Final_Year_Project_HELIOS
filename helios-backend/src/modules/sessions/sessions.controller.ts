import type { Request, Response, NextFunction } from 'express';
import * as sessionsService from './sessions.service.js';
import { sendSuccess, sendNoContent } from '../../core/http/response.js';

export async function listSessionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await sessionsService.findSessionsByUserId(req.ctx.userId!);
    const mapped = sessions.map((s) => ({
      id: s.id,
      status: s.status,
      aal: s.aal,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      isCurrent: s.id === req.ctx.sessionId,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
    }));
    sendSuccess(res, mapped);
  } catch (err) {
    next(err);
  }
}

export async function revokeSessionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await sessionsService.revokeSessionById(req.ctx.userId!, req.params.sessionId as string, req.ctx);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}


