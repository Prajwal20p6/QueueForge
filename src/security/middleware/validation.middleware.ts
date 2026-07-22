import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { Validator } from '../validation/validator';

/**
 * Middleware validating request payloads against Zod schemas.
 * Coerces and binds validated values back to req.body, req.query, or req.params.
 */
export function validationMiddleware(
  validator: Validator,
  schema: z.ZodSchema,
  source: 'body' | 'query' | 'params'
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (source === 'body') {
        req.body = await validator.validateRequest(req.body, schema);
      } else if (source === 'query') {
        req.query = await validator.validateQuery(req.query, schema);
      } else if (source === 'params') {
        req.params = await validator.validateParams(req.params, schema);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
