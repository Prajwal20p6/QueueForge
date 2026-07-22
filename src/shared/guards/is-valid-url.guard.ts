import { URL } from '../types/common.types';

/**
 * Type guard validating string is valid HTTP/HTTPS URL
 */
export function isValidURL(val: any): val is URL {
  if (typeof val !== 'string') return false;
  try {
    const url = new globalThis.URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
