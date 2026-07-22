import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Utility class providing static input validation, format checks, and string/JSON sanitization methods.
 */
export class InputValidator {
  /**
   * Validates standard email address formatting.
   */
  public static validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('email', 'Email address is required.');
    }
    const trimmed = email.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(trimmed)) {
      throw new ValidationError('email', `Invalid email address format: "${email}"`);
    }
  }

  /**
   * Validates v4 UUID format.
   */
  public static validateUUID(id: string, fieldName = 'id'): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError(fieldName, `${fieldName} is required.`);
    }
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(id.trim())) {
      throw new ValidationError(fieldName, `Invalid UUID format for ${fieldName}: "${id}"`);
    }
  }

  /**
   * Validates standard HTTP/HTTPS or generic URL formatting.
   */
  public static validateURL(url: string, fieldName = 'url'): void {
    if (!url || typeof url !== 'string') {
      throw new ValidationError(fieldName, `${fieldName} is required.`);
    }
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:', 'postgresql:', 'redis:', 'amqp:'].includes(parsed.protocol)) {
        throw new ValidationError(fieldName, `URL protocol must be valid. Received: "${parsed.protocol}"`);
      }
    } catch (err: any) {
      if (err instanceof ValidationError) throw err;
      throw new ValidationError(fieldName, `Invalid URL format: "${url}"`);
    }
  }

  /**
   * Validates E.164 or standard phone number formatting.
   */
  public static validatePhoneNumber(phone: string): void {
    if (!phone || typeof phone !== 'string') {
      throw new ValidationError('phone', 'Phone number is required.');
    }
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    if (!phonePattern.test(phone.replace(/[\s()-]/g, ''))) {
      throw new ValidationError('phone', `Invalid phone number format: "${phone}"`);
    }
  }

  /**
   * Evaluates password strength against security policy rules.
   */
  public static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!password || typeof password !== 'string') {
      return { valid: false, errors: ['Password is required.'] };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Sanitizes dangerous HTML tags and script injections from raw input strings.
   */
  public static sanitizeString(input: string, maxLength?: number): string {
    if (!input || typeof input !== 'string') return '';
    let sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    if (maxLength && maxLength > 0 && sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Recursively sanitizes string properties within nested JSON objects.
   */
  public static sanitizeJSON(input: Record<string, any>): Record<string, any> {
    if (!input || typeof input !== 'object') return {};

    const copy: Record<string, any> = Array.isArray(input) ? [] : {};

    for (const [key, val] of Object.entries(input)) {
      if (typeof val === 'string') {
        copy[key] = InputValidator.sanitizeString(val);
      } else if (val && typeof val === 'object') {
        copy[key] = InputValidator.sanitizeJSON(val);
      } else {
        copy[key] = val;
      }
    }

    return copy;
  }
}

export type Validator = typeof InputValidator;
export const Validator = InputValidator;
