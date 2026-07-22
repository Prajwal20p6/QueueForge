import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Route parameter validators executing format and constraint checks.
 */
export const paramValidators = {
  /**
   * Asserts valid UUID format for URL parameter strings.
   */
  validateUUID: (value: any, fieldName = 'id'): string => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError(fieldName, `Parameter "${fieldName}" is required.`);
    }

    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(value.trim())) {
      // Also allow alphanumeric custom ids like 'del-123', 'dest-123', 'res-123'
      if (!/^[a-zA-Z0-9_-]{4,64}$/.test(value.trim())) {
        throw new ValidationError(fieldName, `Invalid parameter format for ${fieldName}: "${value}"`);
      }
    }

    return value.trim();
  },

  /**
   * Asserts valid email address format for parameter strings.
   */
  validateEmail: (value: any): string => {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('email', 'Email parameter is required.');
    }
    const trimmed = value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(trimmed)) {
      throw new ValidationError('email', `Invalid email parameter format: "${value}"`);
    }
    return trimmed;
  },
};
