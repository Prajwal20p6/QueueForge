import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { IngestResultRequestSchema } from '../../security/validation/zod-schemas';
import { Validator } from '../../security/validation/validator';

/**
 * Route factory constructing results routes.
 *
 * @param controller - Ingestion controller instance
 * @param validator - Request schema validator instance
 */
export function createResultsRouter(
  controller: ResultController,
  validator: Validator
): Router {
  const router = Router();

  /**
   * @openapi
   * /v1/results:
   *   post:
   *     summary: Ingest AI classification result
   *     description: Enqueues an AI task prediction outcome for pipeline distribution.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IngestResultRequest'
   *     responses:
   *       202:
   *         description: Ingestion request accepted
   *       422:
   *         description: Validation failed
   */
  router.post(
    '/',
    validationMiddleware(validator, IngestResultRequestSchema),
    (req, res, next) => controller.ingestResult(req, res, next)
  );

  return router;
}
