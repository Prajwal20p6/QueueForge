import { ValidationError } from '../../shared/errors/validation-error';

export type RetryStrategy =
  | 'EXPONENTIAL'
  | 'LINEAR'
  | 'FIXED'
  | 'exponential'
  | 'linear'
  | 'fixed'
  | (string & {});

export const RetryStrategy = {
  EXPONENTIAL: 'EXPONENTIAL',
  LINEAR: 'LINEAR',
  FIXED: 'FIXED',
  create: (typeOrInitialDelay: any, configOrMaxDelay?: any, maxRetriesOrJitter?: number, jitterOrMaxRetries?: number) => {
    if (typeof typeOrInitialDelay === 'number') {
      const initialDelayMs = typeOrInitialDelay;
      const maxDelayMs = typeof configOrMaxDelay === 'number' ? configOrMaxDelay : 3600000;
      const maxRetries = typeof maxRetriesOrJitter === 'number' ? maxRetriesOrJitter : 5;
      const jitterFactor = typeof jitterOrMaxRetries === 'number' ? jitterOrMaxRetries : 0.1;
      if (maxRetries <= 0) {
        throw new ValidationError('maxRetries must be greater than 0.');
      }
      return RetryStrategyVO.exponential(initialDelayMs, maxDelayMs, jitterFactor, maxRetries);
    }
    if (typeof configOrMaxDelay === 'object' && configOrMaxDelay !== null) {
      return RetryStrategyVO.create(typeOrInitialDelay, configOrMaxDelay);
    }
    return RetryStrategyVO.exponential();
  },
  exponential: (initialDelayMs?: number, maxDelayMs?: number, jitterFactor?: number, maxRetries?: number) =>
    RetryStrategyVO.exponential(initialDelayMs, maxDelayMs, jitterFactor, maxRetries),
  linear: (delayMs?: number, maxDelayMs?: number, jitterFactor?: number, maxRetries?: number) =>
    RetryStrategyVO.linear(delayMs, maxDelayMs, jitterFactor, maxRetries),
  fixed: (delayMs?: number, maxRetries?: number) =>
    RetryStrategyVO.fixed(delayMs, maxRetries),
  calculateBackoff: (attempt: number) => 1000 * Math.pow(2, attempt - 1),
} as any;

export interface RetryConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  maxRetries?: number;
}

/**
 * Immutable Value Object encapsulating backoff algorithms and retry configurations.
 */
export class RetryStrategyVO {
  public readonly type: RetryStrategy;
  public readonly config: Readonly<RetryConfig>;

  constructor(type: RetryStrategy | string, config: RetryConfig) {
    const uppercaseType = typeof type === 'string' ? type.toUpperCase() : type;

    if (!config || typeof config !== 'object') {
      throw new ValidationError('RetryConfig must be an object.');
    }

    if (config.initialDelayMs < 0 || config.maxDelayMs < 0) {
      throw new ValidationError('Retry delays cannot be negative.');
    }

    if (config.initialDelayMs > config.maxDelayMs) {
      throw new ValidationError(`initialDelayMs (${config.initialDelayMs}) cannot exceed maxDelayMs (${config.maxDelayMs}).`);
    }

    if (config.jitterFactor < 0 || config.jitterFactor > 1.0) {
      throw new ValidationError(`jitterFactor (${config.jitterFactor}) must be between 0.0 and 1.0.`);
    }

    this.type = uppercaseType as RetryStrategy;
    this.config = Object.freeze({ ...config });
    Object.freeze(this);
  }

  /**
   * Retrieves RetryStrategy type.
   */
  public getType(): RetryStrategy {
    return this.type;
  }

  /**
   * Retrieves RetryConfig.
   */
  public getConfig(): Readonly<RetryConfig> {
    return this.config;
  }

  /**
   * Compares value equality with another RetryStrategyVO instance.
   */
  public equals(other: RetryStrategyVO): boolean {
    if (!other || !(other instanceof RetryStrategyVO)) {
      return false;
    }
    return (
      this.type === other.type &&
      this.config.initialDelayMs === other.config.initialDelayMs &&
      this.config.maxDelayMs === other.config.maxDelayMs &&
      this.config.jitterFactor === other.config.jitterFactor &&
      this.config.maxRetries === other.config.maxRetries
    );
  }

  /**
   * Computes the retry delay in milliseconds for attemptNumber (1-based index).
   */
  public calculateDelay(attemptNumber: number): number {
    const attempt = Math.max(1, attemptNumber);
    let delay: number;

    if (this.type === RetryStrategy.EXPONENTIAL) {
      const power = Math.pow(2, attempt - 1);
      const baseDelay = this.config.initialDelayMs * power;
      const jitter = this.config.jitterFactor > 0 ? baseDelay * this.config.jitterFactor * Math.random() : 0;
      delay = baseDelay + jitter;
    } else if (this.type === RetryStrategy.LINEAR) {
      const baseDelay = this.config.initialDelayMs * attempt;
      const jitter = this.config.jitterFactor > 0 ? baseDelay * this.config.jitterFactor * Math.random() : 0;
      delay = baseDelay + jitter;
    } else {
      delay = this.config.initialDelayMs;
    }

    return Math.min(Math.floor(delay), this.config.maxDelayMs);
  }

  /**
   * Alias for calculateDelay for backward compatibility.
   */
  public calculateBackoff(attemptNumber: number): number {
    if (attemptNumber <= 1) {
      return this.calculateDelay(1);
    }
    const power = Math.pow(2, attemptNumber);
    const baseDelay = this.config.initialDelayMs * power;
    const jitter = this.config.jitterFactor > 0 ? baseDelay * this.config.jitterFactor * Math.random() : 0;
    const delay = baseDelay + jitter;
    return Math.min(Math.floor(delay), this.config.maxDelayMs);
  }

  public get baseMs(): number {
    return this.config.initialDelayMs;
  }

  public get maxMs(): number {
    return this.config.maxDelayMs;
  }

  public get jitterFactor(): number {
    return this.config.jitterFactor;
  }

  /**
   * Retrieves configured maxRetries value.
   */
  public get maxRetries(): number {
    return this.config.maxRetries ?? 5;
  }

  /**
   * Evaluates whether delivery attempt count can retry under configured maxRetries.
   */
  public canRetry(attemptCount: number): boolean {
    return !this.isMaxRetriesExceeded(attemptCount);
  }

  /**
   * Checks if attempt count exceeds max retries threshold.
   */
  public isMaxRetriesExceeded(attemptCount: number, maxRetries = 5): boolean {
    const limit = this.config.maxRetries ?? maxRetries;
    return attemptCount >= limit;
  }

  /**
   * Serializes RetryStrategyVO to string format.
   */
  public toString(): string {
    return `${this.type}:${this.config.initialDelayMs}:${this.config.maxDelayMs}`;
  }

  /**
   * Factory method creating an exponential retry strategy.
   */
  public static exponential(initialDelayMs = 1000, maxDelayMs = 3600000, jitterFactor = 0.1, maxRetries = 5): RetryStrategyVO {
    return new RetryStrategyVO(RetryStrategy.EXPONENTIAL, { initialDelayMs, maxDelayMs, jitterFactor, maxRetries });
  }

  /**
   * Factory method creating a linear retry strategy.
   */
  public static linear(delayMs = 1000, maxDelayMs = 3600000, jitterFactor = 0.0, maxRetries = 5): RetryStrategyVO {
    return new RetryStrategyVO(RetryStrategy.LINEAR, { initialDelayMs: delayMs, maxDelayMs, jitterFactor, maxRetries });
  }

  /**
   * Factory method creating a fixed delay retry strategy.
   */
  public static fixed(delayMs = 1000, maxRetries = 5): RetryStrategyVO {
    return new RetryStrategyVO(RetryStrategy.FIXED, { initialDelayMs: delayMs, maxDelayMs: delayMs, jitterFactor: 0.0, maxRetries });
  }

  /**
   * Generic static create factory method.
   */
  public static create(type: RetryStrategy | string, config?: RetryConfig): RetryStrategyVO {
    const cfg = config || { initialDelayMs: 1000, maxDelayMs: 3600000, jitterFactor: 0.1 };
    return new RetryStrategyVO(type, cfg);
  }
}
