import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Calculates exponential backoff delay with randomized jitter.
 * Formula: 2^retryCount * baseMs + random(0, 2^retryCount * baseMs * jitterFactor) capped at maxMs
 * 
 * @example
 * calculateExponentialBackoff(2, 1000, 10000, 0.5)
 * // 2^2 * 1000 = 4000
 * // Jitter window: random(0, 4000 * 0.5) = random(0, 2000)
 * // returns value between 4000 and 6000
 */
export function calculateExponentialBackoff(
  retryCount: number,
  baseMs: number,
  maxMs: number,
  jitterFactor: number
): number {
  if (retryCount < 0) {
    throw new ValidationError('retryCount', { message: 'Retry count cannot be negative' });
  }

  if (baseMs <= 0) {
    throw new ValidationError('baseMs', { message: 'Base delay must be positive and greater than 0' });
  }

  if (maxMs < baseMs) {
    throw new ValidationError('maxMs', { message: 'Maximum delay cannot be less than base delay' });
  }

  if (jitterFactor < 0 || jitterFactor > 1) {
    throw new ValidationError('jitterFactor', { message: 'Jitter factor must be a number between 0.0 and 1.0' });
  }

  const exponentialFactor = Math.pow(2, retryCount);
  const backoff = exponentialFactor * baseMs;

  const jitterRange = backoff * jitterFactor;
  const jitter = Math.random() * jitterRange;

  const totalDelay = backoff + jitter;

  return Math.min(maxMs, Math.ceil(totalDelay));
}
