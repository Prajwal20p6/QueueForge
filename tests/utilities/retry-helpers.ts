import { WaitHelper } from './wait-helpers';

/**
 * Retry utility for asynchronous test operations.
 */
export class RetryHelper {
  public static async retryAsync<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 100
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          await WaitHelper.waitFor(delayMs);
        }
      }
    }
    throw lastError;
  }
}
