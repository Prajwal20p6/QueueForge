import { Email } from '../types/common.types';

/**
 * Type guard validating string is Email format
 */
export function isEmail(val: any): val is Email {
  if (typeof val !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(val) && val.length <= 254;
}
