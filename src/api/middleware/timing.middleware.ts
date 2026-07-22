import { Request, Response, NextFunction, RequestHandler } from 'express';
import { metricsService } from '../../infrastructure/monitoring/metrics.service';

/**
 * Middleware tracking HTTP request duration, adding Server-Timing response header, and recording metrics.
 */
export function timingMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);

      if (!res.headersSent) {
        try {
          res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
          res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
        } catch {
          // ignore header error if already written
        }
      }

      const routePath = req.route ? req.route.path : req.path;
      try {
        if (metricsService && (metricsService as any).httpDurationHistogram) {
          (metricsService as any).httpDurationHistogram.observe?.(
            { method: req.method, route: routePath, code: String(res.statusCode) },
            durationMs / 1000
          );
        }
      } catch {
        // ignore metric record failures
      }
    });

    next();
  };
}
