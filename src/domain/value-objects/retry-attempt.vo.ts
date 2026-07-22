import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Immutable Value Object recording execution metrics of a single delivery attempt.
 */
export class RetryAttempt {
  public readonly number: number;
  public readonly statusCode: number | null;
  public readonly error: string | null;
  public readonly latencyMs: number | null;
  public readonly timestamp: Date;

  constructor(
    attemptNumber: number,
    statusCode?: number | null,
    error?: string | null,
    latencyMs?: number | null,
    timestamp?: Date
  ) {
    if (typeof attemptNumber !== 'number' || attemptNumber < 1) {
      throw new ValidationError('Retry attempt number must be a positive integer >= 1.');
    }

    if (statusCode !== undefined && statusCode !== null) {
      if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
        throw new ValidationError(`Invalid HTTP status code in RetryAttempt: ${statusCode}.`);
      }
    }

    if (latencyMs !== undefined && latencyMs !== null && (typeof latencyMs !== 'number' || latencyMs < 0)) {
      throw new ValidationError('Latency in milliseconds cannot be negative.');
    }

    this.number = attemptNumber;
    this.statusCode = statusCode ?? null;
    this.error = error ?? null;
    this.latencyMs = latencyMs ?? null;
    this.timestamp = timestamp ? new Date(timestamp) : new Date();

    Object.freeze(this);
  }

  /**
   * Retrieves 1-based attempt number.
   */
  public getNumber(): number {
    return this.number;
  }

  /**
   * Retrieves HTTP status code or null.
   */
  public getStatusCode(): number | null {
    return this.statusCode;
  }

  /**
   * Retrieves error message snippet or null.
   */
  public getError(): string | null {
    return this.error;
  }

  /**
   * Retrieves latency duration in milliseconds or null.
   */
  public getLatency(): number | null {
    return this.latencyMs;
  }

  /**
   * Retrieves execution timestamp Date.
   */
  public getTimestamp(): Date {
    return new Date(this.timestamp);
  }

  /**
   * Evaluates if attempt succeeded with 2xx HTTP response code.
   */
  public wasSuccessful(): boolean {
    return this.statusCode !== null && this.statusCode >= 200 && this.statusCode < 300;
  }

  /**
   * Compares value equality with another RetryAttempt instance.
   */
  public equals(other: RetryAttempt): boolean {
    if (!other || !(other instanceof RetryAttempt)) {
      return false;
    }
    return (
      this.number === other.number &&
      this.statusCode === other.statusCode &&
      this.error === other.error &&
      this.latencyMs === other.latencyMs &&
      this.timestamp.getTime() === other.timestamp.getTime()
    );
  }

  /**
   * Serializes attempt summary to string.
   */
  public toString(): string {
    return `Attempt #${this.number} [Status: ${this.statusCode ?? 'N/A'}, Latency: ${this.latencyMs ?? 0}ms]`;
  }

  /**
   * Static factory method for creating a RetryAttempt instance.
   */
  public static create(
    number: number,
    statusCode?: number | null,
    error?: string | null,
    latencyMs?: number | null,
    timestamp?: Date
  ): RetryAttempt {
    return new RetryAttempt(number, statusCode, error, latencyMs, timestamp);
  }
}
