import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

export interface ResultRouteDependencies {
  resultController: ResultController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
}

/**
 * Creates and configures Express router endpoints for AI classification results ingestion.
 */
export function createResultsRouter(deps: ResultRouteDependencies): Router {
  const router = Router();
  const { resultController, authGuard, rateLimiter } = deps;

  // Middleware pipeline for POST / (ingest result)
  const postMiddleware: any[] = [];
  if (authGuard) postMiddleware.push(authMiddleware(authGuard));
  if (rateLimiter) postMiddleware.push(rateLimitMiddleware(rateLimiter, 100, 60000));

  router.post('/', ...postMiddleware, resultController.ingestResult);

  // Middleware pipeline for GET /:resultId
  const getMiddleware: any[] = [];
  if (authGuard) getMiddleware.push(authMiddleware(authGuard));
  if (rateLimiter) getMiddleware.push(rateLimitMiddleware(rateLimiter, 300, 60000));

  router.get('/:resultId', ...getMiddleware, resultController.getResult);

  return router;
}
