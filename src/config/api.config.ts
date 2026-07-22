import { z } from 'zod';
import { isDevelopment } from './environment';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * ApiConfig interface representing HTTP route base paths, compression and OpenAPI settings
 */
export interface ApiConfig {
  readonly basePath: string;
  readonly version: string;
  readonly timeout: number;
  readonly maxPayloadSize: string;
  readonly enableCompression: boolean;
  readonly enableSwagger: boolean;
  readonly enableGraphQL: boolean;
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly windowMs: number;
    readonly maxRequests: number;
  };
  readonly responseHeaders: Record<string, string>;
  readonly enableResponseCaching: boolean;
  readonly cacheTTL: number;
}

const apiConfigSchema = z.object({
  basePath: z.string().min(1).startsWith('/'),
  version: z.string().min(1),
  timeout: z.number().int().positive(),
  maxPayloadSize: z.string().min(1),
  enableCompression: z.boolean(),
  enableSwagger: z.boolean(),
  enableGraphQL: z.boolean(),
  rateLimit: z.object({
    enabled: z.boolean(),
    windowMs: z.number().int().positive(),
    maxRequests: z.number().int().positive(),
  }),
  responseHeaders: z.record(z.string()),
  enableResponseCaching: z.boolean(),
  cacheTTL: z.number().int().positive(),
});

/**
 * Loads and validates the ApiConfig
 */
export function loadApiConfig(): ApiConfig {
  const isDev = isDevelopment();

  const data = {
    basePath: '/api',
    version: 'v1',
    timeout: 30000,
    maxPayloadSize: '10mb',
    enableCompression: true,
    enableSwagger: isDev,
    enableGraphQL: false,
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100,
    },
    responseHeaders: {
      'X-Powered-By': 'QueueForge',
    },
    enableResponseCaching: true,
    cacheTTL: 300000,
  };

  const parsed = apiConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid ApiConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as ApiConfig;
}
