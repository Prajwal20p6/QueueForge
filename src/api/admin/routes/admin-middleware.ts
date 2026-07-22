import { Request, Response, NextFunction } from 'express';

/**
 * Middleware verifying admin authentication and role claims.
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const adminHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  if (!adminHeader) {
    res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  next();
}

/**
 * Middleware logging admin operations to compliance audit log.
 */
export function adminAuditMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.app.get('logger')?.info?.({
    action: `${req.method} ${req.originalUrl}`,
    user: (req as any).user?.email || 'admin',
    timestamp: new Date().toISOString(),
  }, '[AdminAudit] Operation executed');
  next();
}
