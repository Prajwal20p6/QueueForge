/**
 * Type guard asserting a value is a string
 */
export function isString(val: any): val is string {
  return typeof val === 'string';
}

/**
 * Type guard asserting a value is a number (excluding NaN)
 */
export function isNumber(val: any): val is number {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Type guard asserting a value is a non-null dictionary object (not an array)
 */
export function isObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Type guard asserting a value is an array
 */
export function isArray(val: any): val is any[] {
  return Array.isArray(val);
}

/**
 * Checks if a value belongs to a specific set of enum strings/values
 */
export function isEnum(val: any, enumValues: any[]): boolean {
  return enumValues.includes(val);
}

/**
 * Validates whether a value is a syntactically correct UUID (v4/v5) string
 */
export function isValidUUID(val: any): boolean {
  if (typeof val !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

/**
 * Validates whether a value is a Crockford Base32-compliant 26-character ULID string
 */
export function isValidULID(val: any): boolean {
  if (typeof val !== 'string') return false;
  // ULID character encoding excludes: I, L, O, U
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  return ulidRegex.test(val);
}

/**
 * Type guard asserting a value is a boolean
 */
export function isBoolean(val: any): val is boolean {
  return typeof val === 'boolean';
}

/**
 * Type guard asserting a value is a Record object
 */
export function isRecord(val: any): val is Record<string | number | symbol, any> {
  return val !== null && typeof val === 'object';
}

/**
 * Type guard asserting a value is defined (not undefined)
 */
export function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

/**
 * Type guard asserting a value is not null
 */
export function isNotNull<T>(val: T | null): val is T {
  return val !== null;
}
