import { formatLogEntry } from '../utils/formatting';

/**
 * Method decorator that logs method execution entry, exit, and failures.
 * Supports both synchronous and asynchronous functions.
 */
export function Logged(): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = function (...args: any[]): any {
      const entryMsg = `Entering ${className}.${methodName}`;
      // Safe serialization of arguments
      let serializedArgs: any;
      try {
        serializedArgs = args;
      } catch {
        serializedArgs = '[Circular/Unserializable args]';
      }

      process.stdout.write(formatLogEntry('info', entryMsg, { arguments: serializedArgs }) + '\n');

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then(asyncResult => {
              const exitMsg = `Exiting async ${className}.${methodName}`;
              process.stdout.write(formatLogEntry('info', exitMsg, { result: asyncResult }) + '\n');
              return asyncResult;
            })
            .catch((err: any) => {
              const errMsg = `Failed async ${className}.${methodName}: ${err.message}`;
              process.stdout.write(formatLogEntry('error', errMsg, { error: err.stack }) + '\n');
              throw err;
            });
        }

        const exitMsg = `Exiting ${className}.${methodName}`;
        process.stdout.write(formatLogEntry('info', exitMsg, { result }) + '\n');
        return result;
      } catch (err: any) {
        const errMsg = `Failed ${className}.${methodName}: ${err.message}`;
        process.stdout.write(formatLogEntry('error', errMsg, { error: err.stack }) + '\n');
        throw err;
      }
    };

    return descriptor;
  };
}
