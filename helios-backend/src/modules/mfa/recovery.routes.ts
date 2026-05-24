import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as recoveryService from './recovery.service.js';
import * as authService from '../auth/auth.service.js';
import { sendSuccess } from '../../core/http/response.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { optionalAuthenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { mfaRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { recoveryCodeSchema } from './mfa.schemas.js';
import { AppError } from '../../core/errors/app-error.js';
import { cookieConfig } from '../../config/cookie.config.js';const router = Router();

// Regenerate recovery codes
router.post(
  '/regenerate',
  authenticate,
  requireActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codes = await recoveryService.regenerateRecoveryCodes(req.ctx.userId!, req.ctx);
      sendSuccess(res, { codes }, 201);
    } catch (err) {
      next(err);
    }
  },
);

// Use a recovery code (for MFA challenge)
router.post(
  '/use',
  optionalAuthenticate,
  mfaRateLimiter,
  validate({ body: recoveryCodeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, challengeId } = req.body;

      if (challengeId) {
        // Login MFA flow
        const { findAuthChallengeById } = await import('../auth/auth.repository.js');
        const challenge = await findAuthChallengeById(challengeId);
        if (!challenge || challenge.status !== 'pending') {
          throw new AppError('Invalid challenge', 400, 'INVALID_CHALLENGE');
        }

        const valid = await recoveryService.useRecoveryCode(challenge.user_id, code, req.ctx);
        if (!valid) {
          throw new AppError('Invalid recovery code', 400, 'INVALID_RECOVERY_CODE');
        }

        const tokens = await authService.completeMfaLogin(challengeId, req.ctx);
        res.cookie(cookieConfig.refreshToken.name, tokens.refreshToken, cookieConfig.refreshToken.options);
        sendSuccess(res, { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
        return;
      }

      // Step-up flow
      if (!req.ctx.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const valid = await recoveryService.useRecoveryCode(req.ctx.userId, code, req.ctx);
      if (!valid) {
        throw new AppError('Invalid recovery code', 400, 'INVALID_RECOVERY_CODE');
      }

      // Upgrade session AAL to 2
      if (req.ctx.sessionId) {
        const tokens = await authService.stepUpSession(
          req.ctx.sessionId,
          2,
          [...(req.ctx.amr || ['pwd']), 'mfa'],
          req.ctx,
        );
        res.cookie(cookieConfig.refreshToken.name, tokens.refreshToken, cookieConfig.refreshToken.options);
        sendSuccess(res, { verified: true, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
        return;
      }

      sendSuccess(res, { verified: true });
    } catch (err) {
      next(err);
    }
  },
);

export { router as recoveryRoutes };

