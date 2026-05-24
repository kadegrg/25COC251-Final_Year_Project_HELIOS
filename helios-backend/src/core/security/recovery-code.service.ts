import { randomBytes, createHash } from 'node:crypto';
import { authConfig } from '../../config/auth.config.js';

const CODE_COUNT = authConfig.session.recoveryCodeCount;
const CODE_LENGTH = authConfig.session.recoveryCodeLength;

/**
 * Generate a set of plaintext recovery codes.
 * Returns an array of human-readable codes like "A1B2-C3D4".
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    const raw = randomBytes(CODE_LENGTH)
      .toString('hex')
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    // Format as XXXX-XXXX
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    codes.push(formatted);
  }
  return codes;
}

/**
 * Hash a recovery code for storage.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/-/g, '').toUpperCase();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify a plaintext code against a hash.
 */
export function verifyRecoveryCode(code: string, hash: string): boolean {
  const hashed = hashRecoveryCode(code);
  // Constant-time comparison
  if (hashed.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < hashed.length; i++) {
    result |= hashed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

