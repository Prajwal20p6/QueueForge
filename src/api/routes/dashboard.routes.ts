import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

/**
 * Route factory constructing dashboard stats routes.
 */
export function createDashboardRouter(controller: DashboardController): Router {
  const router = Router();

  router.get('/queue-stats', (req, res, next) => controller.queueStats(req, res, next));

  router.get('/delivery-stats', (req, res, next) => controller.deliveryStats(req, res, next));

  router.get('/worker-stats', (req, res, next) => controller.workerStats(req, res, next));

  router.get('/system-health', (req, res, next) => controller.systemHealth(req, res, next));

  return router;
}
