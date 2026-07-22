import { RequestHandler } from 'express';
import cors from 'cors';
import { SecurityConfig } from '../../config/security.config';

/**
 * Express CORS middleware configured from SecurityConfig settings.
 */
export function corsMiddleware(config?: SecurityConfig | any): RequestHandler {
  const allowedOrigins = config?.corsOrigins || config?.security?.corsOrigins || ['*'];

  return cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID', 'X-Signature', 'X-Timestamp'],
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After', 'Location'],
    credentials: config?.corsCredentials ?? false,
    maxAge: 86400, // 24 hours preflight cache
  });
}
