import { RateLimitError } from '../errors/rate-limit-error';

/**
 * Method decorator that enforces sliding-window rate limiting on class methods.
 * Throws a RateLimitError if invocation requests exceed the threshold.
 * @param requestsPerMinute - Maximum allowed executions within a rolling 60-second window
 */
export function RateLimit(requestsPerMinute: number): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const timestamps: number[] = [];
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = function (...args: any[]): any {
      const now = Date.now();
      const cutoff = now - 60000; // 1 minute sliding window

      // Evict expired timestamps
      while (timestamps.length > 0 && timestamps[0] < cutoff) {
        timestamps.shift();
      }

      if (timestamps.length >= requestsPerMinute) {
        const nextWindowMs = timestamps[0] + 60000;
        const resetSeconds = Math.ceil((nextWindowMs - now) / 1000);

        throw new RateLimitError(
          `Rate limit exceeded on ${className}.${methodName}. Max threshold: ${requestsPerMinute}/min.`,
          {
            limit: requestsPerMinute,
            resetInSeconds: Math.max(1, resetSeconds),
          }
        );
      }

      timestamps.push(now);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
