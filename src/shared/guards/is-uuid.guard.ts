import { UUID } from '../types/common.types';

/**
 * Type guard validating string is UUID v4 format
 */
export function isUUID(val: any): val is UUID {
  if (typeof val !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}
