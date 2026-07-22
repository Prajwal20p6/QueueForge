import { Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { Logger } from '../../observability/logging/logger';

/**
 * Interceptor logging administrative operations parameters in details.
 */
export function adminAuditMiddleware(logger: Logger) {
  return (req: ApiRequest, _res: Response, next: NextFunction): void => {
    const actorId = req.auth ? req.auth.getPrincipalId() : 'system';
    logger.warn(`[Admin Audit] Actor: ${actorId} | Action: ${req.method} ${req.originalUrl}`);
    next();
  };
}
