import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HmacVerifier } from '../hmac/verifier';
import { AuthenticationError } from '../../shared/errors/authentication-error';
import { logger } from '../../infrastructure/logging/logger';

/**
 * Middleware verifying incoming webhook HMAC signatures.
 * Supports combined (t=...,s=...) headers as well as split header signatures.
 */
export function hmacValidationMiddleware(verifier: HmacVerifier): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const correlationId = (req.header('x-correlation-id') ||
      req.header('x-request-id') ||
      'hmac-' + Math.random().toString(36).substring(2, 9)) as string;

    const rawSig =
      req.header('X-QueueForge-Signature') || req.header('X-Signature') || req.header('Signature');
    const rawTimestamp =
      req.header('X-QueueForge-Timestamp') || req.header('X-Timestamp') || req.header('Timestamp');

    try {
      if (!rawSig) {
        throw new AuthenticationError('HMAC request signature is missing');
      }

      // Reconstruct combined format if headers are sent separately
      let signatureHeader = rawSig.trim();
      if (rawTimestamp && !signatureHeader.includes('t=')) {
        signatureHeader = `t=${rawTimestamp.trim()},s=${signatureHeader}`;
      }

      // Perform signature verification
      // If req.body is a string, use it; otherwise, use the parsed object
      const payload = typeof req.body === 'string' ? req.body : req.body;
      await verifier.verify(payload, signatureHeader, correlationId);

      logger.debug(`[Correlation:${correlationId}] HMAC webhook validation succeeded`);
      next();
    } catch (err: any) {
      logger.info(
        `[Correlation:${correlationId}] HMAC signature verification failure: ${err.message}`
      );
      next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message));
    }
  };
}
