import { ValidationError } from '../errors/validation-error';

/**
 * Validates if string matches email pattern
 */
export function isValidEmail(val: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(val) && val.length <= 254;
}

/**
 * Validates if string matches URL pattern
 */
export function isValidURL(val: string): boolean {
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if string is a valid UUID v4 format
 */
export function isValidUUID(val: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

/**
 * Asserts email format throwing ValidationError on failure
 */
export function validateEmail(val: string): void {
  if (!isValidEmail(val)) {
    throw new ValidationError('Email address has invalid formatting');
  }
}
