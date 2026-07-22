import { calculateBackoff } from '../utils/time';
import { formatLogEntry } from '../utils/formatting';

/**
 * Method decorator that intercepts method executions and retries on failure.
 * Automatically wraps synchronous or asynchronous methods into Promise-returning functions.
 * @param maxAttempts - Maximum retry attempts (defaults to 3)
 * @param backoffMs - Delay base scaling in milliseconds (defaults to 1000ms)
 */
export function Retry(maxAttempts: number = 3, backoffMs: number = 1000): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = async function (...args: any[]): Promise<any> {
      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = originalMethod.apply(this, args);

          if (result instanceof Promise) {
            return await result;
          }
          return result;
        } catch (err: any) {
          lastError = err;

          if (attempt < maxAttempts) {
            const delay = calculateBackoff(attempt - 1, backoffMs, 30000);
            const warnMsg = `Method ${className}.${methodName} failed on attempt ${attempt}/${maxAttempts}. Retrying in ${Math.round(delay)}ms. Error: ${err.message}`;
            process.stdout.write(formatLogEntry('warn', warnMsg) + '\n');

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
