import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as mfaRepo from './mfa.repository.js';
import { sendSuccess } from '../../core/http/response.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { requireActiveUser } from '../../middleware/require-active-user.middleware.js';

const router = Router();

/**
 * GET /auth/mfa/factors
 * List the current user's enrolled MFA factors (TOTP, WebAuthn, recovery).
 * Returns factor metadata without secrets.
 */
router.get(
  '/',
  authenticate,
  requireActiveUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.ctx.userId!;

      // Get all factors
      const factors = await mfaRepo.findMfaFactorsByUserId(userId);

      // Enrich WebAuthn factors with credential details
      const webAuthnCredentials = await mfaRepo.findWebAuthnByUserId(userId);

      const result = factors.map((f) => {
        const base = {
          id: f.id,
          factorType: f.factor_type,
          friendlyName: f.friendly_name,
          isVerified: f.is_verified,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        };

        if (f.factor_type === 'webauthn') {
          const cred = webAuthnCredentials.find((c) => c.factor_id === f.id);
          return {
            ...base,
            webauthn: cred
              ? {
                  credentialId: cred.credential_id,
                  deviceType: cred.device_type,
                  backedUp: cred.backed_up,
                  transports: cred.transports,
                  createdAt: cred.created_at,
                }
              : null,
          };
        }

        if (f.factor_type === 'recovery') {
          // Return count of remaining unused codes
          return {
            ...base,
            // Count will be populated below
            _type: 'recovery',
          };
        }

        return base;
      });

      // Get remaining recovery code count
      const unusedCodes = await mfaRepo.findUnusedRecoveryCodes(userId);
      const enriched = result.map((f: any) => {
        if (f._type === 'recovery') {
          const { _type, ...rest } = f;
          return { ...rest, remainingCodes: unusedCodes.length };
        }
        return f;
      });

      sendSuccess(res, enriched);
    } catch (err) {
      next(err);
    }
  },
);

export { router as factorsRoutes };

