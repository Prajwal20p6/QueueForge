import client from 'prom-client';

// Global histogram tracking execution metrics for decorated methods
const methodDurationSeconds = new client.Histogram({
  name: 'method_duration_seconds',
  help: 'Class method execution duration latency in seconds',
  labelNames: ['class', 'method', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * Method decorator that measures class method execution duration latency
 * and records the statistics directly in a Prometheus histogram metric.
 */
export function Measure(): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = function (...args: any[]): any {
      const startTime = Date.now();
      let status = 'success';

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then(asyncResult => {
              const durationSec = (Date.now() - startTime) / 1000;
              methodDurationSeconds.observe(
                { class: className, method: methodName, status },
                durationSec
              );
              return asyncResult;
            })
            .catch((err: any) => {
              status = 'fail';
              const durationSec = (Date.now() - startTime) / 1000;
              methodDurationSeconds.observe(
                { class: className, method: methodName, status },
                durationSec
              );
              throw err;
            });
        }

        const durationSec = (Date.now() - startTime) / 1000;
        methodDurationSeconds.observe(
          { class: className, method: methodName, status },
          durationSec
        );
        return result;
      } catch (err: any) {
        status = 'fail';
        const durationSec = (Date.now() - startTime) / 1000;
        methodDurationSeconds.observe(
          { class: className, method: methodName, status },
          durationSec
        );
        throw err;
      }
    };

    return descriptor;
  };
}
