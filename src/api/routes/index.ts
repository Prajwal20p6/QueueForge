import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { DeliveryController } from '../controllers/delivery.controller';
import { DestinationController } from '../controllers/destination.controller';
import { LineageController } from '../controllers/lineage.controller';
import { HealthController } from '../controllers/health.controller';
import { MetricsController } from '../controllers/metrics.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { createApiRouter } from './api.routes';

export interface RouteDependencies {
  resultController: ResultController;
  deliveryController: DeliveryController;
  destinationController: DestinationController;
  lineageController: LineageController;
  healthController: HealthController;
  metricsController: MetricsController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
  validator?: any;
  logger?: any;
  dashboardController?: any;
}

/**
 * Registers all REST API routes and returns configured master router.
 */
export function registerRoutes(appOrRouter: any, deps: RouteDependencies): Router {
  const router = createApiRouter({
    resultController: deps.resultController,
    deliveryController: deps.deliveryController,
    destinationController: deps.destinationController,
    lineageController: deps.lineageController,
    healthController: deps.healthController,
    metricsController: deps.metricsController,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  if (appOrRouter && typeof appOrRouter.use === 'function') {
    appOrRouter.use(router);
  }

  return router;
}

export * from './result.routes';
export * from './delivery.routes';
export * from './destination.routes';
export * from './lineage.routes';
export * from './health.routes';
export * from './metrics.routes';
export * from './api.routes';
