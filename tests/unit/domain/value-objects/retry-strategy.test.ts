import { RetryStrategy } from '../../../../src/domain/value-objects/retry-strategy';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('RetryStrategy Value Object Unit Tests', () => {
  it('should successfully create a valid RetryStrategy', () => {
    const strategy = RetryStrategy.create(1000, 30000, 5, 0.5);

    expect(strategy.baseMs).toBe(1000);
    expect(strategy.maxMs).toBe(30000);
    expect(strategy.maxRetries).toBe(5);
    expect(strategy.jitterFactor).toBe(0.5);
  });

  it('should throw ValidationError on out-of-bounds parameters', () => {
    expect(() => RetryStrategy.create(-10, 1000, 5)).toThrow(ValidationError);
    expect(() => RetryStrategy.create(1000, 500, 5)).toThrow(ValidationError);
    expect(() => RetryStrategy.create(1000, 10000, 0)).toThrow(ValidationError);
    expect(() => RetryStrategy.create(1000, 10000, 5, 1.2)).toThrow(ValidationError);
  });

  it('should calculate exponential backoff delay correctly with jitter bounds', () => {
    const strategy = RetryStrategy.create(1000, 10000, 5, 0.2); // 20% max jitter

    // Attempt 0: 2^0 * 1000 = 1000. Jitter [0, 200]. Range [1000, 1200]
    const delay0 = strategy.calculateBackoff(0);
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(1200);

    // Attempt 3: 2^3 * 1000 = 8000. Jitter [0, 1600]. Range [8000, 9600]
    const delay3 = strategy.calculateBackoff(3);
    expect(delay3).toBeGreaterThanOrEqual(8000);
    expect(delay3).toBeLessThanOrEqual(9600);
  });

  it('should cap calculations at maxMs', () => {
    const strategy = RetryStrategy.create(1000, 5000, 5, 0.1);

    // Exponential delay for attempt 4 is 16000, capped at 5000
    const delay4 = strategy.calculateBackoff(4);
    expect(delay4).toBe(5000);
  });

  it('should correctly flag if retry limit is reached', () => {
    const strategy = RetryStrategy.create(1000, 5000, 3);

    expect(strategy.canRetry(0)).toBe(true);
    expect(strategy.canRetry(2)).toBe(true);
    expect(strategy.canRetry(3)).toBe(false);
  });

  it('should evaluate value equality correctly', () => {
    const strategy1 = RetryStrategy.create(1000, 5000, 5);
    const strategy2 = RetryStrategy.create(1000, 5000, 5);
    const strategy3 = RetryStrategy.create(2000, 5000, 5);

    expect(strategy1.equals(strategy2)).toBe(true);
    expect(strategy1.equals(strategy3)).toBe(false);
  });
});
