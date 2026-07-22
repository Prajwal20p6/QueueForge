import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../logging/logger';

const API_KEY = process.env.API_KEY || 'qf_secret_api_key_12345';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-this-in-production';

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const headerKey = req.header('X-API-Key');
  const authHeader = req.header('Authorization');
  let providedKey: string | null = null;

  if (headerKey) {
    providedKey = headerKey;
  } else if (authHeader && authHeader.startsWith('ApiKey ')) {
    providedKey = authHeader.substring(7);
  }

  if (!providedKey) {
    res.status(401).json({ error: 'Authentication API Key is missing' });
    return;
  }

  // Use time-constant comparison to prevent timing attacks
  try {
    const keyBuf = Buffer.from(API_KEY);
    const provBuf = Buffer.from(providedKey);
    if (keyBuf.length === provBuf.length && timingSafeEqual(keyBuf, provBuf)) {
      next();
      return;
    }
  } catch (err) {
    logger.error('Error comparing API Keys: ', err);
  }

  res.status(403).json({ error: 'Invalid API Key' });
}

export function validateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'JWT token is missing' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({ error: `Invalid or expired JWT token: ${err.message}` });
  }
}

// Allows either API Key or JWT authentication for flexible ingestion
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');
  const apiKeyHeader = req.header('X-API-Key');

  if (apiKeyHeader || (authHeader && authHeader.startsWith('ApiKey '))) {
    validateApiKey(req, res, next);
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    validateJwt(req, res, next);
  } else {
    res.status(401).json({ error: 'Authentication required (API Key or JWT)' });
  }
}

// HMAC webhook signature validation middleware (used by mock targets to verify our signatures)
export function verifyHmacSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.header('X-QueueForge-Signature');
    if (!signature) {
      res.status(401).json({ error: 'HMAC signature is missing' });
      return;
    }

    const payloadString = JSON.stringify(req.body);
    const expectedSignature = createHmac('sha256', secret).update(payloadString).digest('hex');

    try {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
        next();
        return;
      }
    } catch (err) {
      logger.error('Error verifying HMAC signature: ', err);
    }

    res.status(403).json({ error: 'Invalid HMAC signature' });
  };
}
