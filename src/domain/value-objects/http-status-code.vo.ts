import { ValidationError } from '../errors/validation-error';

/**
 * Immutable Value Object representing an HTTP status code (100 - 599).
 */
export class HttpStatusCode {
  public readonly value: number;

  constructor(value: number) {
    if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value)) {
      throw new ValidationError('HTTP status code must be an integer.');
    }

    if (value < 100 || value > 599) {
      throw new ValidationError(`Invalid HTTP status code: ${value}. Must be between 100 and 599.`);
    }

    this.value = value;
    Object.freeze(this);
  }

  /**
   * Retrieves numeric HTTP status code value.
   */
  public getValue(): number {
    return this.value;
  }

  public getCode(): number {
    return this.value;
  }

  /**
   * Compares value equality with another HttpStatusCode instance.
   */
  public equals(other: HttpStatusCode): boolean {
    if (!other || !(other instanceof HttpStatusCode)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Serializes status code to string.
   */
  public toString(): string {
    return this.value.toString();
  }

  /**
   * Evaluates if status code is in 2xx range.
   */
  public isSuccess(): boolean {
    return this.value >= 200 && this.value < 300;
  }

  /**
   * Evaluates if status code is in 4xx range.
   */
  public isClientError(): boolean {
    return this.value >= 400 && this.value < 500;
  }

  /**
   * Evaluates if status code is in 5xx range.
   */
  public isServerError(): boolean {
    return this.value >= 500 && this.value < 600;
  }

  /**
   * Evaluates if status code is retryable (408 Request Timeout, 429 Too Many Requests, or 5xx Server Error).
   */
  public isRetryable(): boolean {
    return this.value === 408 || this.value === 429 || this.isServerError();
  }

  /**
   * Evaluates if status code signifies a permanent client error (4xx except 408 Timeout and 429 Rate Limit).
   */
  public isPermanentError(): boolean {
    return [400, 401, 403, 404, 422].includes(this.value);
  }

  /**
   * Evaluates if status code represents a permanent unretryable failure (4xx except 408 & 429).
   */
  public isPermanentFailure(): boolean {
    return this.isClientError() && this.value !== 408 && this.value !== 429;
  }

  /**
   * Static factory method creating an HttpStatusCode instance.
   */
  public static create(code: number): HttpStatusCode {
    return new HttpStatusCode(code);
  }
}
