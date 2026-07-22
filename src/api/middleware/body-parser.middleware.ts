import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Custom error class for request payload size limit breaches.
 */
export class PayloadTooLargeError extends BaseError {
  constructor(message: string = 'Request payload size exceeds maximum allowed limit.') {
    super(ErrorCode.VALIDATION_FAILED, HttpStatus.VALIDATION_ERROR, message);
    this.name = 'PayloadTooLargeError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Express body-parser middleware with payload size restrictions and 413 error handling.
 */
export function bodyParserMiddleware(limit: string = '10mb'): RequestHandler[] {
  const jsonParser = express.json({ limit });
  const urlencodedParser = express.urlencoded({ extended: true, limit });

  const errorHandler = (err: any, _req: Request, _res: Response, next: NextFunction): void => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      next(new PayloadTooLargeError(`Request payload size exceeds maximum allowed limit (${limit}).`));
    } else {
      next(err);
    }
  };

  return [jsonParser, urlencodedParser, errorHandler as any];
}
