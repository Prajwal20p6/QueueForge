import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { requireRole } from '../middleware/authorization.middleware';

export interface DeliveryRouteDependencies {
  deliveryController: DeliveryController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
}

/**
 * Creates and configures Express router endpoints for delivery logs and DLQ retries.
 */
export function createDeliveriesRouter(deps: DeliveryRouteDependencies): Router {
  const router = Router();
  const { deliveryController, authGuard, rateLimiter } = deps;

  // GET / (public or standard limit)
  const listMiddleware: any[] = [];
  if (rateLimiter) listMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));
  router.get('/', ...listMiddleware, deliveryController.listDeliveries);

  // GET /:deliveryId
  const getMiddleware: any[] = [];
  if (authGuard) getMiddleware.push(authMiddleware(authGuard));
  if (rateLimiter) getMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));
  router.get('/:deliveryId', ...getMiddleware, deliveryController.getDelivery);

  // POST /:deliveryId/retry (admin only)
  const retryMiddleware: any[] = [];
  if (authGuard) {
    retryMiddleware.push(authMiddleware(authGuard));
    retryMiddleware.push(requireRole('ADMIN'));
  }
  if (rateLimiter) retryMiddleware.push(rateLimitMiddleware(rateLimiter, 30, 60000));
  router.post('/:deliveryId/retry', ...retryMiddleware, deliveryController.retryDelivery);

  return router;
}
