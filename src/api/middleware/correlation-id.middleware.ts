import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';

export interface CorrelationRequest extends Request {
  correlationId?: string;
  requestId?: string;
}

/**
 * Middleware ensuring every HTTP request carries a unique correlation trace identifier.
 */
export function correlationIdMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const getHeader = (name: string): string | undefined => {
      if (typeof req.header === 'function') {
        return req.header(name);
      }
      if (req.headers) {
        const lower = name.toLowerCase();
        return (req.headers[lower] || req.headers[name]) as string | undefined;
      }
      return undefined;
    };

    const incomingId =
      getHeader('X-Correlation-ID') ||
      getHeader('X-Request-ID');

    const correlationId = incomingId || `req-${crypto.randomUUID()}`;

    (req as CorrelationRequest).correlationId = correlationId;
    (req as CorrelationRequest).requestId = correlationId;

    if (typeof res.setHeader === 'function') {
      res.setHeader('X-Correlation-ID', correlationId);
    }

    next();
  };
}
