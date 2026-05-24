import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as webAuthnService from './webauthn.service.js';
import * as authService from '../auth/auth.service.js';
import { sendSuccess, sendNoContent } from '../../core/http/response.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { optionalAuthenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { mfaRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { findUserById } from '../auth/auth.repository.js';
import { factorIdParamSchema, webAuthnRegisterOptionsSchema, webAuthnRegisterVerifySchema, webAuthnAuthVerifySchema } from './mfa.schemas.js';
import { AppError } from '../../core/errors/app-error.js';
import { cookieConfig } from '../../config/cookie.config.js';

const router = Router();

// Generate registration options
router.post(
  '/register/options',
  authenticate,
  requireActiveUser,
  mfaRateLimiter,
  validate({ body: webAuthnRegisterOptionsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await findUserById(req.ctx.userId!);
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

      const result = await webAuthnService.generateWebAuthnRegisterOptions(
        req.ctx.userId!,
        user.username,
        req.body.friendlyName,
        req.ctx,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// Verify registration
router.post(
  '/register/verify',
  authenticate,
  requireActiveUser,
  mfaRateLimiter,
  validate({ body: webAuthnRegisterVerifySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { factorId, challengeId, credential } = req.body;
      await webAuthnService.verifyWebAuthnRegistration(
        req.ctx.userId!,
        factorId,
        challengeId,
        credential,
        req.ctx,
      );
      sendSuccess(res, { message: 'WebAuthn credential registered' });
    } catch (err) {
      next(err);
    }
  },
);

// Generate authentication options
router.post(
  '/authenticate/options',
  optionalAuthenticate,
  mfaRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Can be called during login MFA flow (no auth) or step-up (with auth)
      let userId = req.ctx.userId || req.body.userId;

      // During login MFA flow: resolve userId from the pending MFA challengeId
      if (!userId && req.body.challengeId) {
        const { findAuthChallengeById } = await import('../auth/auth.repository.js');
        const mfaChallenge = await findAuthChallengeById(req.body.challengeId);
        if (mfaChallenge && mfaChallenge.status === 'pending') {
          userId = mfaChallenge.user_id;
        }
      }

      if (!userId) throw new AppError('User ID required', 400, 'MISSING_USER_ID');

      const result = await webAuthnService.generateWebAuthnAuthOptions(userId, req.ctx);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// Verify authentication
router.post(
  '/authenticate/verify',
  optionalAuthenticate,
  mfaRateLimiter,
  validate({ body: webAuthnAuthVerifySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { challengeId, credential } = req.body;

      // Find challenge to determine the user
      const { findAuthChallengeById } = await import('../auth/auth.repository.js');
      const challenge = await findAuthChallengeById(challengeId);
      if (!challenge) throw new AppError('Invalid challenge', 400, 'INVALID_CHALLENGE');

      const valid = await webAuthnService.verifyWebAuthnAuthentication(
        challenge.user_id,
        challengeId,
        credential,
        req.ctx,
      );

      if (!valid) {
        throw new AppError('WebAuthn verification failed', 400, 'WEBAUTHN_VERIFICATION_FAILED');
      }

      // If this was part of a login MFA flow, complete login
      if (challenge.challenge_type === 'webauthn_authenticate' && !req.ctx.userId) {
        // Check if there's a pending mfa_login challenge for this user
        // Complete MFA login flow
        const tokens = await authService.completeMfaLogin(challengeId, req.ctx);
        res.cookie(cookieConfig.refreshToken.name, tokens.refreshToken, cookieConfig.refreshToken.options);
        sendSuccess(res, { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
        return;
      }

      // Step-up flow: upgrade session AAL
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

// Remove WebAuthn factor
router.delete(
  '/:factorId',
  authenticate,
  requireActiveUser,
  validate({ params: factorIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await webAuthnService.removeWebAuthnFactor(req.ctx.userId!, req.params.factorId as string, req.ctx);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
);

export { router as webAuthnRoutes };


