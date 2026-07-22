/**
 * Method decorator that throws a TimeoutError if execution exceeds the specified timeout in milliseconds
 */
export function Timeout(timeoutMs: number): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<any> {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      );

      const methodPromise = originalMethod.apply(this, args);
      return Promise.race([methodPromise, timeoutPromise]);
    };

    return descriptor;
  };
}
