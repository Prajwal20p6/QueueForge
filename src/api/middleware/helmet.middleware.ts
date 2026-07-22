import { RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * Helmet security middleware attaching standard HTTP security headers.
 */
export function helmetMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
