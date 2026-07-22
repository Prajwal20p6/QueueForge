import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { Validator } from '../../security/validation/validator';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Express middleware executing body validation using custom schemas and mapping validation failures.
 */
export function validationMiddleware(validator: Validator, schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = validator.validate(schema, req.body);

    if (!result.valid) {
      const fieldErrors = result.errors || [];
      const validationError = new ValidationError('Validation failed', fieldErrors);
      return next(validationError);
    }

    req.body = result.data;
    next();
  };
}
