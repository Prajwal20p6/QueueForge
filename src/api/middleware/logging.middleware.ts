import { Request, Response, NextFunction, RequestHandler } from 'express';
import { CorrelationRequest } from './correlation-id.middleware';

/**
 * Express middleware logging incoming request metadata and tracking duration safely.
 */
export function loggingMiddleware(logger?: any): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const correlationId = (req as CorrelationRequest).correlationId || 'none';

    const userAgent = typeof req.header === 'function' ? req.header('user-agent') : (req.headers ? req.headers['user-agent'] : undefined);

    // Log request start (without sensitive headers or body payload)
    logger?.debug?.(`[HTTP IN] ${req.method} ${req.originalUrl || req.url}`, {
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent,
    });

    if (typeof res.on === 'function') {
      res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger?.info?.(`[HTTP OUT] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`, {
          correlationId,
          statusCode: res.statusCode,
          durationMs,
        });

        if (logLevel !== 'info') {
          logger?.[logLevel]?.(`[HTTP OUT ERROR] ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`);
        }
      });
    }

    next();
  };
}
