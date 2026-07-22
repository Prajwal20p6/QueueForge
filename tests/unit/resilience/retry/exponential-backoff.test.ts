import { calculateExponentialBackoff } from '../../../../src/resilience/retry/exponential-backoff';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('ExponentialBackoff Unit Tests', () => {
  it('should compute delay within base and jitter ranges', () => {
    // base = 1000, max = 10000, attempt = 1, jitter = 0.5 (4000 to 6000 bounds)
    const delay = calculateExponentialBackoff(1, 1000, 10000, 0.5);

    expect(delay).toBeGreaterThanOrEqual(2000); // 2^1 * 1000 = 2000
    expect(delay).toBeLessThanOrEqual(3000); // 2000 + 2000 * 0.5 = 3000
  });

  it('should cap delay at maxMs thresholds', () => {
    // 2^10 * 1000 = 1024000ms delay, capped at 5000ms
    const delay = calculateExponentialBackoff(10, 1000, 5000, 0.0);
    expect(delay).toBe(5000);
  });

  it('should throw ValidationError on out of bounds arguments', () => {
    expect(() => calculateExponentialBackoff(-1, 1000, 5000, 0.5)).toThrow(ValidationError);
    expect(() => calculateExponentialBackoff(1, -100, 5000, 0.5)).toThrow(ValidationError);
  });
});
