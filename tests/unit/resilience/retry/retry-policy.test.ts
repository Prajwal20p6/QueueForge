import { RetryPolicy } from '../../../../src/resilience/retry/retry-policy';

describe('RetryPolicy Unit Tests', () => {
  it('should identify transient network and HTTP 5xx errors for retries', () => {
    const policy = new RetryPolicy(3, 'EXPONENTIAL');

    expect(policy.shouldRetry(new Error('ETIMEDOUT connection failed'), 1)).toBe(true);
    expect(policy.shouldRetry({ statusCode: 503, message: 'Service Unavailable' } as any, 1)).toBe(true);
    expect(policy.shouldRetry({ statusCode: 404, message: 'Not Found' } as any, 1)).toBe(false);
  });

  it('should stop retrying when maxAttempts is exceeded', () => {
    const policy = new RetryPolicy(3);

    expect(policy.shouldRetry(new Error('ETIMEDOUT'), 1)).toBe(true);
    expect(policy.shouldRetry(new Error('ETIMEDOUT'), 2)).toBe(true);
    expect(policy.shouldRetry(new Error('ETIMEDOUT'), 3)).toBe(false); // attempt 3 >= max 3
  });
});
