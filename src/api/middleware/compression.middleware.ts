import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Middleware enabling GZIP response payload compression for responses exceeding 1KB.
 */
export function compressionMiddleware(): RequestHandler {
  try {
    const compression = require('compression');
    return compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    });
  } catch {
    // Fallback pass-through middleware if compression library is uninstalled
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
}
