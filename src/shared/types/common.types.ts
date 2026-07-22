/**
 * Branded nominal type representing a UUID v4 string
 */
export type UUID = string & { readonly __brand: 'UUID' };

/**
 * Branded nominal type representing a valid email address string
 */
export type Email = string & { readonly __brand: 'Email' };

/**
 * Branded nominal type representing a valid URL string
 */
export type URL = string & { readonly __brand: 'URL' };

/**
 * Branded nominal type representing an ISO 8601 Date Time string
 */
export type ISO8601DateTime = string & { readonly __brand: 'ISO8601DateTime' };

/**
 * Type representing arbitrary structured JSON values
 */
export type JSON = string & { readonly __brand: 'JSON' };

/**
 * Branded nominal type representing HTTP Status codes
 */
export type StatusCode = number & { readonly __brand: 'StatusCode' };


