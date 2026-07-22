import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';

/**
 * Route factory constructing deliveries status and retrying endpoints.
 */
export function createDeliveriesRouter(controller: DeliveryController): Router {
  const router = Router();

  router.get('/', (req, res, next) => controller.listDeliveries(req, res, next));

  router.get('/:deliveryId', (req, res, next) => controller.getDelivery(req, res, next));

  router.patch('/:deliveryId/retry', (req, res, next) => controller.retryDelivery(req, res, next));

  return router;
}
