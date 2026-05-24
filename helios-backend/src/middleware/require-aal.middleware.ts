import type { Request, Response, NextFunction } from 'express';
import { InsufficientAALError, AuthenticationError } from '../core/errors/auth-errors.js';

/**
 * Factory that creates middleware requiring a minimum AAL level.
 * AAL1 = basic password auth
 * AAL2 = MFA verified
 * AAL3 = hardware-backed / recent step-up (future)
 */
export function requireAAL(minAAL: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx.userId) {
      return next(new AuthenticationError());
    }

    if (req.ctx.aal < minAAL) {
      return next(new InsufficientAALError(minAAL, req.ctx.aal));
    }

    next();
  };
}

