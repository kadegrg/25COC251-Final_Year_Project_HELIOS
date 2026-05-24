import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendNoContent } from '../../core/http/response.js';
import { cookieConfig } from '../../config/cookie.config.js';

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ctx);

    if (result.type === 'mfa_required') {
      res.status(200).json({
        success: true,
        data: {
          type: 'mfa_required',
          challengeId: result.challengeId,
          availableMethods: result.availableMethods,
        },
      });
      return;
    }

    // Set refresh token as httpOnly cookie
    if (result.tokens) {
      res.cookie(
        cookieConfig.refreshToken.name,
        result.tokens.refreshToken,
        cookieConfig.refreshToken.options,
      );
    }

    sendSuccess(res, {
      type: 'authenticated',
      accessToken: result.tokens!.accessToken,
      expiresIn: result.tokens!.expiresIn,
      sessionId: result.sessionId,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Read from body or cookie
    const rawRefreshToken =
      req.body.refreshToken ||
      req.cookies?.[cookieConfig.refreshToken.name];

    if (!rawRefreshToken) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' },
      });
      return;
    }

    const tokens = await authService.refreshTokens(rawRefreshToken, req.ctx);

    res.cookie(
      cookieConfig.refreshToken.name,
      tokens.refreshToken,
      cookieConfig.refreshToken.options,
    );

    sendSuccess(res, {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.ctx.sessionId) {
      await authService.logout(req.ctx.sessionId, req.ctx);
    }

    res.clearCookie(cookieConfig.refreshToken.name, {
      path: cookieConfig.refreshToken.options.path,
      domain: cookieConfig.refreshToken.options.domain,
    });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function logoutAllHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.ctx.userId) {
      await authService.logoutAll(req.ctx.userId, req.ctx);
    }

    res.clearCookie(cookieConfig.refreshToken.name, {
      path: cookieConfig.refreshToken.options.path,
      domain: cookieConfig.refreshToken.options.domain,
    });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.ctx.userId!, req.ctx);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function stepUpHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { factorType, code } = req.body;

    // Verify MFA factor for step-up
    let verified = false;

    if (factorType === 'totp' && code) {
      const { verifyTotpCode } = await import('../mfa/totp.service.js');
      verified = await verifyTotpCode(req.ctx.userId!, code, req.ctx);
    } else if (factorType === 'recovery' && code) {
      const { useRecoveryCode } = await import('../mfa/recovery.service.js');
      verified = await useRecoveryCode(req.ctx.userId!, code, req.ctx);
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STEP_UP', message: 'Provide a valid factorType and code (or use WebAuthn flow)' },
      });
      return;
    }

    if (!verified) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_MFA_CODE', message: 'MFA verification failed' },
      });
      return;
    }

    // Upgrade the existing session to AAL2
    const tokens = await authService.stepUpSession(
      req.ctx.sessionId!,
      2,
      [...(req.ctx.amr || ['pwd']), 'mfa'],
      req.ctx,
    );

    res.cookie(
      cookieConfig.refreshToken.name,
      tokens.refreshToken,
      cookieConfig.refreshToken.options,
    );

    sendSuccess(res, {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

