import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ErrorSerializer } from '../serializers/error-serializer';
import { CorrelationRequest } from './correlation-id.middleware';
import { metricsService } from '../../infrastructure/monitoring/metrics.service';

/**
 * Global Express error handling middleware translating all unhandled exceptions into clean JSON error envelopes.
 */
export function errorHandlerMiddleware(logger?: any, observability?: any): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, _next: NextFunction): void => {
    const correlationId = (req as CorrelationRequest).correlationId || 'none';

    // 1. Log error details
    const logLevel = err.statusCode && err.statusCode < 500 ? 'warn' : 'error';
    logger?.[logLevel]?.(`[ErrorHandler] Exception handling ${req.method} ${req.originalUrl || req.path}: ${err.message}`, {
      correlationId,
      errorName: err.name,
      statusCode: err.statusCode,
      stack: err.stack,
    });

    // 2. Trace OpenTelemetry error
    if (observability?.tracer) {
      try {
        const span = observability.tracer.getTracer?.().startSpan?.('error.handler');
        span?.recordException?.(err);
        span?.end?.();
      } catch {
        // ignore
      }
    }

    // 3. Serialize error
    const { statusCode, payload } = ErrorSerializer.serialize(err, correlationId);

    // 4. Publish metrics
    try {
      if (metricsService && (metricsService as any).errorCounter) {
        (metricsService as any).errorCounter.inc?.({ code: payload.code, status: String(statusCode) });
      }
    } catch {
      // ignore
    }

    // 5. Send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json(payload);
  };
}

export const errorHandler = errorHandlerMiddleware;
