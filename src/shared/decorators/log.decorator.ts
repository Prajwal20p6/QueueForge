import { formatLogEntry } from '../utils/formatting';

/**
 * Method decorator that logs entry, exit, arguments and latency timing metrics
 */
export function Log(level: 'info' | 'debug' | 'warn' | 'error' = 'info'): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = function (...args: any[]): any {
      const start = Date.now();
      const sanitizedArgs = args.map((a) => {
        if (a && typeof a === 'object') {
          // Redact secrets
          const res = { ...a };
          ['secret', 'password', 'token', 'apiKey', 'authorization'].forEach((key) => {
            if (key in res) res[key] = '[REDACTED]';
          });
          return res;
        }
        return a;
      });

      const entryMsg = `[Log] Entering ${className}.${methodName} with arguments: ${JSON.stringify(sanitizedArgs)}`;
      process.stdout.write(formatLogEntry(level, entryMsg) + '\n');

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then((res) => {
              const elapsed = Date.now() - start;
              const exitMsg = `[Log] Exiting ${className}.${methodName} - Duration: ${elapsed}ms`;
              process.stdout.write(formatLogEntry(level, exitMsg) + '\n');
              return res;
            })
            .catch((err: any) => {
              const elapsed = Date.now() - start;
              const errMsg = `[Log] Error in ${className}.${methodName} after ${elapsed}ms: ${err.message}`;
              process.stdout.write(formatLogEntry('error', errMsg) + '\n');
              throw err;
            });
        }

        const elapsed = Date.now() - start;
        const exitMsg = `[Log] Exiting ${className}.${methodName} - Duration: ${elapsed}ms`;
        process.stdout.write(formatLogEntry(level, exitMsg) + '\n');
        return result;
      } catch (err: any) {
        const elapsed = Date.now() - start;
        const errMsg = `[Log] Error in ${className}.${methodName} after ${elapsed}ms: ${err.message}`;
        process.stdout.write(formatLogEntry('error', errMsg) + '\n');
        throw err;
      }
    };

    return descriptor;
  };
}
