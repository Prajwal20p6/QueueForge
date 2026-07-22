import { trace } from '@opentelemetry/api';

/**
 * Method decorator that wraps the target method in an OpenTelemetry active span.
 * Automatically records exception details and sets error status if the method fails.
 * @param spanName - Optional span identifier name (defaults to className.methodName)
 */
export function Traced(spanName?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';
    const resolvedSpanName = spanName || `${className}.${methodName}`;

    descriptor.value = function (...args: any[]): any {
      const tracer = trace.getTracer('queueforge-decorator-tracer');

      return tracer.startActiveSpan(resolvedSpanName, span => {
        try {
          const result = originalMethod.apply(this, args);

          if (result instanceof Promise) {
            return result
              .then(asyncResult => {
                span.end();
                return asyncResult;
              })
              .catch((err: any) => {
                span.recordException(err);
                span.setStatus({ code: 2, message: err.message }); // 2 = SpanStatusCode.ERROR
                span.end();
                throw err;
              });
          }

          span.end();
          return result;
        } catch (err: any) {
          span.recordException(err);
          span.setStatus({ code: 2, message: err.message }); // 2 = SpanStatusCode.ERROR
          span.end();
          throw err;
        }
      });
    };

    return descriptor;
  };
}
