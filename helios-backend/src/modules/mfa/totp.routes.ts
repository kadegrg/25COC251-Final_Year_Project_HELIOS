import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as totpService from './totp.service.js';
import * as authService from '../auth/auth.service.js';
import { sendSuccess, sendNoContent } from '../../core/http/response.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { optionalAuthenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { mfaRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { totpEnrolVerifySchema, totpVerifySchema, factorIdParamSchema } from './mfa.schemas.js';
import { AppError } from '../../core/errors/app-error.js';
import { cookieConfig } from '../../config/cookie.config.js';

const router = Router();

// Start TOTP enrolment
router.post(
  '/enrol/start',
  authenticate,
  requireActiveUser,
  mfaRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await totpService.startTotpEnrolment(req.ctx.userId!, req.ctx);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
);

// Verify TOTP enrolment
router.post(
  '/enrol/verify',
  authenticate,
  requireActiveUser,
  mfaRateLimiter,
  validate({ body: totpEnrolVerifySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { factorId, code } = req.body;
      await totpService.verifyTotpEnrolment(req.ctx.userId!, factorId, code, req.ctx);
      sendSuccess(res, { message: 'TOTP factor verified and enrolled' });
    } catch (err) {
      next(err);
    }
  },
);

// Verify TOTP code (for MFA challenge during login or step-up)
router.post(
  '/verify',
  optionalAuthenticate,
  mfaRateLimiter,
  validate({ body: totpVerifySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, challengeId } = req.body;

      // If this is a login MFA challenge
      if (challengeId) {
        // We need to resolve the user from the challenge
        const { findAuthChallengeById } = await import('../auth/auth.repository.js');
        const challenge = await findAuthChallengeById(challengeId);
        if (!challenge || challenge.status !== 'pending') {
          throw new AppError('Invalid challenge', 400, 'INVALID_CHALLENGE');
        }

        const valid = await totpService.verifyTotpCode(challenge.user_id, code, req.ctx);
        if (!valid) {
          throw new AppError('Invalid TOTP code', 400, 'INVALID_TOTP_CODE');
        }

        // Complete the MFA login
        const tokens = await authService.completeMfaLogin(challengeId, req.ctx);

        res.cookie(
          cookieConfig.refreshToken.name,
          tokens.refreshToken,
          cookieConfig.refreshToken.options,
        );

        sendSuccess(res, {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        });
        return;
      }

      // Otherwise this is a step-up verification for authenticated user
      if (!req.ctx.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const valid = await totpService.verifyTotpCode(req.ctx.userId, code, req.ctx);
      if (!valid) {
        throw new AppError('Invalid TOTP code', 400, 'INVALID_TOTP_CODE');
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

// Remove TOTP factor
router.delete(
  '/:factorId',
  authenticate,
  requireActiveUser,
  validate({ params: factorIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await totpService.removeTotpFactor(req.ctx.userId!, req.params.factorId as string, req.ctx);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
);

export { router as totpRoutes };


