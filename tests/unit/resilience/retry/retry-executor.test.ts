import { RetryExecutor } from '../../../../src/resilience/retry/retry-executor';
import { RetryPolicy } from '../../../../src/resilience/retry/retry-policy';

describe('RetryExecutor Unit Tests', () => {
  it('should execute task successfully on first attempt without retrying', async () => {
    const policy = new RetryPolicy(3, 'FIXED', 1000);
    const executor = new RetryExecutor(policy);
    const fn = jest.fn().mockResolvedValue('SUCCESS');

    const result = await executor.execute(fn);
    expect(result).toBe('SUCCESS');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(executor.metrics.getMetrics().successfulAttempts).toBe(1);
  });

  it('should retry transient failures up to maxAttempts and succeed', async () => {
    const policy = new RetryPolicy(3, 'FIXED', 1000);
    const executor = new RetryExecutor(policy);

    let attempts = 0;
    const fn = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('ETIMEDOUT transient error');
      }
      return 'RECOVERED';
    });

    const result = await executor.execute(fn);
    expect(result).toBe('RECOVERED');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(executor.metrics.getMetrics().retriedSuccesses).toBe(1);
  });

  it('should rethrow error when max attempts are exceeded', async () => {
    const policy = new RetryPolicy(2, 'FIXED', 1000);
    const executor = new RetryExecutor(policy);

    const fn = jest.fn().mockRejectedValue(new Error('ETIMEDOUT persistent error'));

    await expect(executor.execute(fn)).rejects.toThrow('ETIMEDOUT persistent error');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(executor.metrics.getMetrics().maxRetriesExceeded).toBe(1);
  });
});
