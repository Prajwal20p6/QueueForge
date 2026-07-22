import { ResilienceConfig } from '../../config/resilience';
import { ValidationError } from '../../shared/errors/validation-error';

export interface RetryConfig {
  maxRetries: number;
  baseMs: number;
  maxMs: number;
  jitterFactor: number;
}

export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_BASE_MS = 1000;
export const DEFAULT_MAX_MS = 3600000;
export const DEFAULT_JITTER = 1;

/**
 * Returns standard and verified configurations bounds for retry queues.
 */
export function getRetryConfig(config: ResilienceConfig): RetryConfig {
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseMs = config.backoffBaseMs ?? DEFAULT_BASE_MS;
  const maxMs = config.backoffMaxMs ?? DEFAULT_MAX_MS;
  const jitterFactor = config.backoffJitterFactor ?? DEFAULT_JITTER;

  if (maxRetries < 0) {
    throw new ValidationError('maxRetries', { message: 'Max retries cannot be negative' });
  }

  if (baseMs <= 0) {
    throw new ValidationError('baseMs', { message: 'Base backoff delay must be positive' });
  }

  if (maxMs < baseMs) {
    throw new ValidationError('maxMs', { message: 'Max backoff delay cannot be less than base delay' });
  }

  if (jitterFactor < 0 || jitterFactor > 1) {
    throw new ValidationError('jitterFactor', { message: 'Jitter factor must be between 0.0 and 1.0' });
  }

  return {
    maxRetries,
    baseMs,
    maxMs,
    jitterFactor,
  };
}
