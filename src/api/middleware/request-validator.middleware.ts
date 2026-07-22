import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Middleware factory running custom request payload validation functions on req.body, req.query, or req.params.
 */
export function validateRequest(
  validatorFn: (data: any) => any,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const targetData = req[source];
      const validated = validatorFn(targetData);
      req[source] = validated;
      next();
    } catch (err: any) {
      next(err);
    }
  };
}

export const requestValidatorMiddleware = validateRequest;
