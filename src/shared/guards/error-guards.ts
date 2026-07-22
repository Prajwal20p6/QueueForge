import { BaseError } from '../errors/base-error';
import { ValidationError } from '../errors/validation-error';
import { DeliveryError } from '../errors/delivery-error';
import { InfrastructureError } from '../errors/infrastructure-error';
import { TRANSIENT_STATUS_CODES } from '../constants/retry-config';

/**
 * Type guard checking if an error inherits from BaseError
 */
export function isBaseError(error: any): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard checking if an error is a ValidationError
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard checking if an error is a DeliveryError
 */
export function isDeliveryError(error: any): error is DeliveryError {
  return error instanceof DeliveryError;
}

/**
 * Type guard checking if an error is an InfrastructureError
 */
export function isInfrastructureError(error: any): error is InfrastructureError {
  return error instanceof InfrastructureError;
}

/**
 * Evaluates whether an error represents a retryable transient failure
 * @param error - The error to check
 * @returns True if the failure is transient and can be retried
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // 1. If it has a status code (e.g. Axios error or DeliveryError context), check context status overrides first
  const status = error.context?.statusCode ?? error.context?.status ?? error.statusCode;
  if (status && TRANSIENT_STATUS_CODES.includes(Number(status))) {
    return true;
  }

  // If the status is explicitly a permanent HTTP code, it is NOT retryable
  if (status && !TRANSIENT_STATUS_CODES.includes(Number(status))) {
    return false;
  }

  // 2. Fall back to socket, network, and timeout message heuristics
  const message = String(error.message || '').toLowerCase();
  const transientPatterns = [
    'timeout',
    'network',
    'connrefused',
    'econnrefused',
    'etimedout',
    'socket',
    '503',
    '504',
    '429',
  ];

  return transientPatterns.some(pattern => message.includes(pattern));
}
