const cache = new WeakMap<any, Map<string, { value: any; expiresAt: number }>>();

/**
 * Method decorator that caches method invocation results with a TTL in milliseconds
 */
export function Memoize(ttlMs = 60000): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const keyStr = String(propertyKey);

    descriptor.value = function (...args: any[]): any {
      let instanceCache = cache.get(this);
      if (!instanceCache) {
        instanceCache = new Map();
        cache.set(this, instanceCache);
      }

      const cacheKey = `${keyStr}:${JSON.stringify(args)}`;
      const cached = instanceCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }

      const result = originalMethod.apply(this, args);
      instanceCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + ttlMs,
      });

      return result;
    };

    return descriptor;
  };
}
