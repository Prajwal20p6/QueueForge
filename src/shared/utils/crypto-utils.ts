import { createHash, randomBytes } from 'crypto';

/**
 * Computes SHA256 string hash
 */
export function hash(val: string): string {
  return createHash('sha256').update(val).digest('hex');
}

/**
 * Compiles a crypto-safe random token
 */
export function generateRandomString(length = 32): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generates an access token
 */
export function generateToken(): string {
  return randomBytes(32).toString('base64');
}
