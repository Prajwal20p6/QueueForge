export const ERROR_CODES = {
  VALIDATION_FAILED: 'E001',
  RESOURCE_NOT_FOUND: 'E002',
  STATE_CONFLICT: 'E003',
  UNAUTHENTICATED: 'E004',
  UNAUTHORIZED: 'E005',
  RATE_LIMIT_EXCEEDED: 'E006',
  INTERNAL_ERROR: 'E500',
};

export const ERROR_MESSAGES: Record<string, string> = {
  E001: 'The request body payload failed validation checks',
  E002: 'The requested resource target was not found',
  E003: 'A state conflict was detected in duplicate records',
  E004: 'Request authentication token is invalid or missing',
  E005: 'Actor permissions scopes are insufficient',
  E006: 'API request limits frequencies have been breached',
  E500: 'An unexpected internal server exception occurred',
};
export { ERROR_CODES as codes };
export { ERROR_MESSAGES as messages };
