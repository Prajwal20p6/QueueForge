import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';

export interface HealthRouteDependencies {
  healthController: HealthController;
  authGuard?: AuthGuard | any;
}

/**
 * Creates and configures Express router endpoints for liveness and readiness health checks.
 */
export function createHealthRouter(deps: HealthRouteDependencies): Router {
  const router = Router();
  const { healthController, authGuard } = deps;

  // GET / (unauthenticated probe)
  router.get('/', healthController.getHealth);

  // GET /details (admin only)
  const detailsMiddleware: any[] = [];
  if (authGuard) {
    detailsMiddleware.push(authMiddleware(authGuard));
    detailsMiddleware.push(requireRole('ADMIN'));
  }
  router.get('/details', ...detailsMiddleware, healthController.getHealthDetails);

  return router;
}
