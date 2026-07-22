import { BackoffCalculator } from '../../../../src/resilience/retry/backoff-calculator';

describe('BackoffCalculator Unit Tests', () => {
  it('should calculate exponential backoff delay within expected range', () => {
    const delay1 = BackoffCalculator.exponentialBackoff(1, 1000, 60000, 0);
    const delay2 = BackoffCalculator.exponentialBackoff(2, 1000, 60000, 0);
    const delay3 = BackoffCalculator.exponentialBackoff(3, 1000, 60000, 0);

    expect(delay1).toBe(1000);
    expect(delay2).toBe(2000);
    expect(delay3).toBe(4000);
  });

  it('should calculate linear backoff delay correctly', () => {
    const delay1 = BackoffCalculator.linearBackoff(1, 1000, 10000);
    const delay2 = BackoffCalculator.linearBackoff(2, 1000, 10000);
    const delay3 = BackoffCalculator.linearBackoff(3, 1000, 10000);

    expect(delay1).toBe(1000);
    expect(delay2).toBe(2000);
    expect(delay3).toBe(3000);
  });

  it('should cap delays at maxDelayMs', () => {
    const delay = BackoffCalculator.exponentialBackoff(10, 1000, 5000, 0);
    expect(delay).toBe(5000);
  });
});
