import { Router } from 'express';
import { DestinationController } from '../controllers/destination.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { requireRole } from '../middleware/authorization.middleware';

export interface DestinationRouteDependencies {
  destinationController: DestinationController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
}

/**
 * Creates and configures Express router endpoints for managing destination profiles.
 */
export function createDestinationsRouter(deps: DestinationRouteDependencies): Router {
  const router = Router();
  const { destinationController, authGuard, rateLimiter } = deps;

  // GET /
  const listMiddleware: any[] = [];
  if (authGuard) listMiddleware.push(authMiddleware(authGuard));
  if (rateLimiter) listMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));
  router.get('/', ...listMiddleware, destinationController.listDestinations);

  // POST / (admin only)
  const postMiddleware: any[] = [];
  if (authGuard) {
    postMiddleware.push(authMiddleware(authGuard));
    postMiddleware.push(requireRole('ADMIN'));
  }
  if (rateLimiter) postMiddleware.push(rateLimitMiddleware(rateLimiter, 50, 60000));
  router.post('/', ...postMiddleware, destinationController.createDestination);

  // GET /:destinationId
  const getMiddleware: any[] = [];
  if (authGuard) getMiddleware.push(authMiddleware(authGuard));
  if (rateLimiter) getMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));
  router.get('/:destinationId', ...getMiddleware, destinationController.getDestination);

  // PATCH /:destinationId (admin only)
  const patchMiddleware: any[] = [];
  if (authGuard) {
    patchMiddleware.push(authMiddleware(authGuard));
    patchMiddleware.push(requireRole('ADMIN'));
  }
  if (rateLimiter) patchMiddleware.push(rateLimitMiddleware(rateLimiter, 50, 60000));
  router.patch('/:destinationId', ...patchMiddleware, destinationController.updateDestination);

  // DELETE /:destinationId (admin only)
  const deleteMiddleware: any[] = [];
  if (authGuard) {
    deleteMiddleware.push(authMiddleware(authGuard));
    deleteMiddleware.push(requireRole('ADMIN'));
  }
  if (rateLimiter) deleteMiddleware.push(rateLimitMiddleware(rateLimiter, 30, 60000));
  router.delete('/:destinationId', ...deleteMiddleware, destinationController.deleteDestination);

  return router;
}
