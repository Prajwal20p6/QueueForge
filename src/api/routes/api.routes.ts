import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { DeliveryController } from '../controllers/delivery.controller';
import { DestinationController } from '../controllers/destination.controller';
import { LineageController } from '../controllers/lineage.controller';
import { HealthController } from '../controllers/health.controller';
import { MetricsController } from '../controllers/metrics.controller';
import { AuthGuard } from '../../security/auth/auth-guard';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';

import { createResultsRouter } from './result.routes';
import { createDeliveriesRouter } from './delivery.routes';
import { createDestinationsRouter } from './destination.routes';
import { createLineageRouter } from './lineage.routes';
import { createHealthRouter } from './health.routes';
import { createMetricsRouter } from './metrics.routes';
import { createAdminRouter } from './admin';

export interface ApiRouterDependencies {
  resultController: ResultController;
  deliveryController: DeliveryController;
  destinationController: DestinationController;
  lineageController: LineageController;
  healthController: HealthController;
  metricsController: MetricsController;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
}

/**
 * Creates the master Express router mounting all resource subrouters under /api/v1 and /admin.
 */
export function createApiRouter(deps: ApiRouterDependencies): Router {
  const router = Router();

  const resultsSubrouter = createResultsRouter({
    resultController: deps.resultController,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  const deliveriesSubrouter = createDeliveriesRouter({
    deliveryController: deps.deliveryController,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  const destinationsSubrouter = createDestinationsRouter({
    destinationController: deps.destinationController,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  const lineageSubrouter = createLineageRouter({
    lineageController: deps.lineageController,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  const healthSubrouter = createHealthRouter({
    healthController: deps.healthController,
    authGuard: deps.authGuard,
  });

  const metricsSubrouter = createMetricsRouter({
    metricsController: deps.metricsController,
  });

  const adminSubrouter = createAdminRouter();

  // Mount subrouters under versioned /api/v1 prefix and root aliases
  const v1 = Router();
  v1.use('/results', resultsSubrouter);
  v1.use('/deliveries', deliveriesSubrouter);
  v1.use('/destinations', destinationsSubrouter);
  v1.use('/lineage', lineageSubrouter);
  v1.use('/health', healthSubrouter);
  v1.use('/metrics', metricsSubrouter);
  v1.use('/admin', adminSubrouter);

  router.use('/api/v1', v1);
  router.use('/v1', v1);

  // Direct root fallbacks for monitoring probes and admin portal
  router.use('/health', healthSubrouter);
  router.use('/metrics', metricsSubrouter);
  router.use('/admin', adminSubrouter);

  return router;
}
