import type { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AccountDisabledError } from '../core/errors/auth-errors.js';
import { query } from '../db/index.js';

/**
 * Ensures the authenticated user exists and has an active status.
 * Must be placed after the authenticate middleware.
 */
export async function requireActiveUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.ctx.userId) {
      throw new AuthenticationError();
    }

    const result = await query<{ status: string }>(
      'SELECT status FROM iam_users WHERE id = $1',
      [req.ctx.userId],
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    const { status } = result.rows[0];

    if (status === 'deleted') {
      throw new AuthenticationError('User not found');
    }

    if (status === 'disabled' || status === 'locked') {
      throw new AccountDisabledError();
    }

    if (status !== 'active') {
      throw new AuthenticationError('Account is not active');
    }

    next();
  } catch (err) {
    next(err);
  }
}

