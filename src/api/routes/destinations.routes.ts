import { Router } from 'express';
import { DestinationController } from '../controllers/destination.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateDestinationRequestSchema } from '../../security/validation/zod-schemas';
import { Validator } from '../../security/validation/validator';

/**
 * Route factory constructing destinations routes.
 */
export function createDestinationsRouter(
  controller: DestinationController,
  validator: Validator
): Router {
  const router = Router();

  router.post(
    '/',
    validationMiddleware(validator, CreateDestinationRequestSchema),
    (req, res, next) => controller.createDestination(req, res, next)
  );

  router.get('/', (req, res, next) => controller.listDestinations(req, res, next));

  router.get('/:destinationId', (req, res, next) => controller.getDestination(req, res, next));

  router.patch(
    '/:destinationId',
    validationMiddleware(validator, CreateDestinationRequestSchema.partial()),
    (req, res, next) => controller.updateDestination(req, res, next)
  );

  router.delete('/:destinationId', (req, res, next) => controller.deleteDestination(req, res, next));

  return router;
}
