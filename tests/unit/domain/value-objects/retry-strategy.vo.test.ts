import { RetryStrategy, RetryStrategyVO } from '../../../../src/domain/value-objects/retry-strategy.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('RetryStrategy Value Object Unit Tests', () => {
  it('should successfully create exponential, linear, and fixed retry strategies', () => {
    const exp = RetryStrategyVO.exponential(1000, 30000, 0.0);
    expect(exp.getType()).toBe(RetryStrategy.EXPONENTIAL);
    expect(exp.calculateDelay(1)).toBe(1000);
    expect(exp.calculateDelay(2)).toBe(2000);
    expect(exp.calculateDelay(3)).toBe(4000);

    const lin = RetryStrategyVO.linear(1000, 5000);
    expect(lin.getType()).toBe(RetryStrategy.LINEAR);
    expect(lin.calculateDelay(1)).toBe(1000);
    expect(lin.calculateDelay(2)).toBe(2000);
    expect(lin.calculateDelay(10)).toBe(5000); // capped at maxDelay

    const fix = RetryStrategyVO.fixed(2500);
    expect(fix.getType()).toBe(RetryStrategy.FIXED);
    expect(fix.calculateDelay(1)).toBe(2500);
    expect(fix.calculateDelay(5)).toBe(2500);
  });

  it('should cap exponential delays at maxDelayMs', () => {
    const exp = RetryStrategyVO.exponential(1000, 5000, 0.0);
    expect(exp.calculateDelay(10)).toBe(5000);
  });

  it('should throw ValidationError for negative delays or initial > max', () => {
    expect(() => new RetryStrategyVO(RetryStrategy.EXPONENTIAL, { initialDelayMs: -1, maxDelayMs: 1000, jitterFactor: 0.1 })).toThrow(ValidationError);
    expect(() => new RetryStrategyVO(RetryStrategy.EXPONENTIAL, { initialDelayMs: 5000, maxDelayMs: 1000, jitterFactor: 0.1 })).toThrow(ValidationError);
  });
});
