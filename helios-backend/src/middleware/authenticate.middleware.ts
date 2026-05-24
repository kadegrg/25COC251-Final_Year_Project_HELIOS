import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../core/security/token.service.js';
import { AuthenticationError } from '../core/errors/auth-errors.js';

/**
 * JWT authentication middleware.
 * Reads token from Authorization: Bearer <token> header.
 * Populates req.ctx with user/session info on success.
 *
 * Use `authenticate` for required auth, `optionalAuthenticate` for optional.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const claims = await verifyAccessToken(token);

    req.ctx.userId = claims.sub;
    req.ctx.sessionId = claims.sid;
    req.ctx.aal = claims.aal;
    req.ctx.amr = claims.amr;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication — does not fail if no token is present,
 * but populates ctx if a valid token exists.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const claims = await verifyAccessToken(token);

    req.ctx.userId = claims.sub;
    req.ctx.sessionId = claims.sid;
    req.ctx.aal = claims.aal;
    req.ctx.amr = claims.amr;

    next();
  } catch {
    // Token invalid — treat as unauthenticated
    next();
  }
}

