import { AppError } from './app-error.js';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', true, details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(details?: unknown) {
    super('Invalid credentials', 401, 'INVALID_CREDENTIALS', true, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(details?: unknown) {
    super('Token has expired', 401, 'TOKEN_EXPIRED', true, details);
  }
}

export class InvalidTokenError extends AppError {
  constructor(details?: unknown) {
    super('Invalid token', 401, 'INVALID_TOKEN', true, details);
  }
}

export class TokenReuseDetectedError extends AppError {
  constructor(details?: unknown) {
    super('Token reuse detected — all sessions revoked', 401, 'TOKEN_REUSE_DETECTED', true, details);
  }
}

export class AccountLockedError extends AppError {
  constructor(details?: unknown) {
    super('Account temporarily locked due to too many failed attempts', 423, 'ACCOUNT_LOCKED', true, details);
  }
}

export class AccountDisabledError extends AppError {
  constructor(details?: unknown) {
    super('Account is disabled', 403, 'ACCOUNT_DISABLED', true, details);
  }
}

export class MfaRequiredError extends AppError {
  public readonly challengeId: string;
  public readonly availableMethods: string[];

  constructor(challengeId: string, availableMethods: string[]) {
    super('MFA verification required', 403, 'MFA_REQUIRED', true);
    this.challengeId = challengeId;
    this.availableMethods = availableMethods;
  }
}

export class InsufficientAALError extends AppError {
  public readonly requiredAAL: number;
  public readonly currentAAL: number;

  constructor(requiredAAL: number, currentAAL: number) {
    super(`Insufficient authentication assurance level. Required: AAL${requiredAAL}, current: AAL${currentAAL}`, 403, 'INSUFFICIENT_AAL', true);
    this.requiredAAL = requiredAAL;
    this.currentAAL = currentAAL;
  }
}

export class InsufficientPermissionError extends AppError {
  constructor(permission?: string) {
    super(
      permission ? `Missing required permission: ${permission}` : 'Insufficient permissions',
      403,
      'INSUFFICIENT_PERMISSION',
      true,
    );
  }
}

export class SessionExpiredError extends AppError {
  constructor(details?: unknown) {
    super('Session has expired', 401, 'SESSION_EXPIRED', true, details);
  }
}

export class SessionRevokedError extends AppError {
  constructor(details?: unknown) {
    super('Session has been revoked', 401, 'SESSION_REVOKED', true, details);
  }
}

