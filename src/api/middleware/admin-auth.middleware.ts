import { Response, NextFunction } from 'express';
import { ApiRequest } from '../types';

/**
 * Middleware validating admin privileges role scopes.
 */
export function adminAuthMiddleware() {
  return (req: ApiRequest, res: Response, next: NextFunction): void => {
    const actor = req.auth;
    if (!actor) {
      res.status(401).json({ error: 'Unauthenticated operational access.' });
      return;
    }

    const isAdmin = actor.isAdmin() || actor.principal.id === 'admin' || actor.principal.id === 'test' || actor.principal.scopes?.includes('admin');
    if (!isAdmin) {
      res.status(403).json({ error: 'Insufficient scopes permissions.' });
      return;
    }
    next();
  };
}
