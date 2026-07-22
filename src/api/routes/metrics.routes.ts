import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';

export interface MetricsRouteDependencies {
  metricsController: MetricsController;
}

/**
 * Creates and configures Express router endpoints for Prometheus metrics scraping.
 */
export function createMetricsRouter(deps: MetricsRouteDependencies): Router {
  const router = Router();
  const { metricsController } = deps;

  // GET / (unauthenticated Prometheus scraper)
  router.get('/', metricsController.getMetrics);

  return router;
}
