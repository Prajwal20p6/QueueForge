import { z } from 'zod';
import { EnvLoader } from './env';

import { ValidationError } from '../shared/errors/validation-error';

/**
 * RedisConfig interface representing connection settings and pools
 */
export interface RedisConfig {
  readonly url: string;
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly db: number;
  readonly maxRetries: number;
  readonly retryStrategyMs: number;
  readonly connectionTimeoutMs: number;
  readonly enableOfflineQueue: boolean;
  readonly enableReadyCheck: boolean;
  readonly family: number;
  readonly keyPrefix: string;
  readonly enableTls: boolean;
  readonly tlsRejectUnauthorized: boolean;
  
  // Backward compatibility fields
  readonly poolMin: number;
  readonly poolMax: number;
  readonly enableTLS: boolean;
  readonly connectionTimeout: number;
  readonly idleTimeout: number;
  readonly maxRetriesOnConnectionFailure: number;
  readonly retryDelayMs: number;
  readonly enablePersistence: boolean;
  readonly persistenceMode: 'AOF' | 'RDB';
  readonly flushDbOnStart: boolean;
}

const redisConfigSchema = z.object({
  url: z.string().url().refine((url) => url.startsWith('redis://') || url.startsWith('rediss://'), {
    message: 'REDIS_URL must be a valid Redis connection string',
  }),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  password: z.string().optional(),
  db: z.number().int().min(0),
  maxRetries: z.number().int().positive(),
  retryStrategyMs: z.number().int().positive(),
  connectionTimeoutMs: z.number().int().positive(),
  enableOfflineQueue: z.boolean(),
  enableReadyCheck: z.boolean(),
  family: z.enum([4, 6] as any).or(z.number()),
  keyPrefix: z.string(),
  enableTls: z.boolean(),
  tlsRejectUnauthorized: z.boolean(),
  poolMin: z.number().int().min(1),
  poolMax: z.number().int().min(1),
  enableTLS: z.boolean(),
  connectionTimeout: z.number().int().positive(),
  idleTimeout: z.number().int().positive(),
  maxRetriesOnConnectionFailure: z.number().int().positive(),
  retryDelayMs: z.number().int().positive(),
  enablePersistence: z.boolean(),
  persistenceMode: z.enum(['AOF', 'RDB']),
  flushDbOnStart: z.boolean(),
});

/**
 * Loads, parses, and validates the RedisConfig
 */
export function loadRedisConfig(envOverride?: any): RedisConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const url = EnvLoader.get('REDIS_URL');

  // Pre-schema validation for URL scheme
  if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
    throw new ValidationError('Invalid REDIS_URL format: must use redis:// or rediss:// scheme');
  }

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  const enableTls = isProd || url.startsWith('rediss://');

  let host = 'localhost';
  let port = 6379;
  let password: string | undefined;

  try {
    const parsedUrl = new URL(url);
    host = parsedUrl.hostname || host;
    port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : port;
    if (parsedUrl.password) {
      password = decodeURIComponent(parsedUrl.password);
    }
  } catch {
    throw new ValidationError('REDIS_URL is not a valid URL');
  }

  const poolMin = Number(EnvLoader.getOrDefault('REDIS_POOL_MIN', '2'));
  const poolMax = Number(EnvLoader.getOrDefault('REDIS_POOL_MAX', '10'));

  if (poolMin > poolMax) {
    throw new ValidationError('Invalid Redis pool configuration: REDIS_POOL_MIN must be <= REDIS_POOL_MAX');
  }

  const data = {
    url,
    host,
    port,
    password,
    db: 0,
    maxRetries: 10,
    retryStrategyMs: 1000,
    connectionTimeoutMs: 30000,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    family: 4,
    keyPrefix: 'queueforge:',
    enableTls,
    tlsRejectUnauthorized: true,
    poolMin,
    poolMax,
    enableTLS: enableTls,
    connectionTimeout: 30000,
    idleTimeout: 30000,
    maxRetriesOnConnectionFailure: 10,
    retryDelayMs: 1000,
    enablePersistence: true,
    persistenceMode: 'AOF',
    flushDbOnStart: isTest,
  };

  const parsed = redisConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid RedisConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as RedisConfig;
}
export { loadRedisConfig as getRedisConfig };
