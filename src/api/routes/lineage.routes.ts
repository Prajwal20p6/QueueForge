import { Router } from 'express';
import { LineageController } from '../controllers/lineage.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

export interface LineageRouteDependencies {
  lineageController: LineageController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
}

/**
 * Creates and configures Express router endpoints for querying classification lineage events.
 */
export function createLineageRouter(deps: LineageRouteDependencies): Router {
  const router = Router();
  const { lineageController, rateLimiter } = deps;

  const getMiddleware: any[] = [];
  if (rateLimiter) getMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));

  // GET /:emailId (public)
  router.get('/:emailId', ...getMiddleware, lineageController.getLineage);

  return router;
}
