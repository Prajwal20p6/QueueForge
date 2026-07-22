import { ValidationError } from '../errors/validation-error';

/**
 * Immutable Value Object representing an RFC 5321 compliant email address identifier.
 */
export class EmailId {
  public readonly value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email address must be a non-empty string.');
    }

    const trimmed = value.trim();
    // RFC 5321 email validation regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmed)) {
      throw new ValidationError(`Invalid email address format: "${value}". Must conform to RFC 5321.`);
    }

    this.value = trimmed;
    Object.freeze(this);
  }

  /**
   * Retrieves the raw string value of the EmailId.
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Compares equality with another EmailId value object.
   */
  public equals(other: EmailId): boolean {
    if (!other || !(other instanceof EmailId)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Serializes the EmailId to string.
   */
  public toString(): string {
    return this.value;
  }

  public valueOf(): string {
    return this.value;
  }

  /**
   * Static factory method for creating and validating an EmailId instance.
   */
  public static create(email: string): EmailId {
    return new EmailId(email);
  }
}
