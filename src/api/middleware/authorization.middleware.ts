import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthorizationError } from '../../security/errors/authorization-error';
import { ApiRequest } from '../types';

/**
 * Middleware factory asserting that authenticated requesters possess a required role string.
 */
export function requireRole(role: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const apiReq = req as ApiRequest;
    const auth = apiReq.auth as any;

    if (!auth || (!auth.authenticated && auth.getIdentifier?.() === 'anonymous')) {
      return next(new AuthorizationError('Authentication required before performing role authorization check.', role));
    }

    if (typeof auth.hasRole === 'function' && !auth.hasRole(role)) {
      return next(new AuthorizationError(`Access denied: Required role "${role}" was not found.`, role));
    }

    next();
  };
}

/**
 * Middleware factory asserting that authenticated requesters possess a required permission string.
 */
export function requirePermission(permission: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const apiReq = req as ApiRequest;
    const auth = apiReq.auth as any;

    if (!auth || (!auth.authenticated && auth.getIdentifier?.() === 'anonymous')) {
      return next(new AuthorizationError('Authentication required before performing permission authorization check.', permission));
    }

    if (typeof auth.hasPermission === 'function' && !auth.hasPermission(permission)) {
      return next(new AuthorizationError(`Access denied: Required permission "${permission}" was not found.`, permission));
    }

    next();
  };
}
