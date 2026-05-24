import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/app-error.js';
import { MfaRequiredError, InsufficientAALError } from '../core/errors/auth-errors.js';
import { ValidationError } from '../core/errors/validation-errors.js';
import { logger } from '../core/logging/logger.js';

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 * Never leaks internal details in production.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.ctx?.requestId || 'unknown';

  // MFA required — return challenge details
  if (err instanceof MfaRequiredError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        challengeId: err.challengeId,
        availableMethods: err.availableMethods,
      },
    });
    return;
  }

  // Insufficient AAL — return required/current levels for step-up
  if (err instanceof InsufficientAALError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requiredAAL: err.requiredAAL,
        currentAAL: err.currentAAL,
      },
    });
    return;
  }

  // Validation errors — include field details
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.fieldErrors,
      },
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, requestId }, 'Non-operational error');
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && process.env.NODE_ENV !== 'production'
          ? { details: err.details }
          : {}),
      },
    });
    return;
  }

  // Unknown / unhandled errors — never leak internals
  logger.error({ err, requestId }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

