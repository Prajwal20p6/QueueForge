import { z } from 'zod';
import { EnvLoader } from './env';

import { ValidationError } from '../shared/errors/validation-error';

/**
 * DatabaseConfig interface representing PostgreSQL settings
 */
export interface DatabaseConfig {
  readonly url: string;
  readonly maxConnections: number;
  readonly minConnections: number;
  readonly connectionTimeoutMs: number;
  readonly idleTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly enableLogging: boolean;
  readonly enableSSL: boolean;
  readonly rejectUnauthorized: boolean;
  
  // Backward compatibility fields
  readonly poolMin: number;
  readonly poolMax: number;
  readonly enableMetrics: boolean;
  readonly connectionTimeout: number;
  readonly idleTimeout: number;
  readonly maxLifetime: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  
  // Parsed details
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
}

const databaseConfigSchema = z
  .object({
    url: z.string().url().refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a valid PostgreSQL connection URL',
    }),
    maxConnections: z.number().int().min(1).max(100),
    minConnections: z.number().int().min(1),
    connectionTimeoutMs: z.number().int().positive(),
    idleTimeoutMs: z.number().int().positive(),
    statementTimeoutMs: z.number().int().positive(),
    enableLogging: z.boolean(),
    enableSSL: z.boolean(),
    rejectUnauthorized: z.boolean(),
    poolMin: z.number().int().min(1),
    poolMax: z.number().int().min(1),
    enableMetrics: z.boolean(),
    connectionTimeout: z.number().int().positive(),
    idleTimeout: z.number().int().positive(),
    maxLifetime: z.number().int().positive(),
    retryAttempts: z.number().int().nonnegative(),
    retryDelay: z.number().int().positive(),
    host: z.string(),
    port: z.number().int().positive(),
    database: z.string(),
    user: z.string(),
  })
  .refine((data) => data.maxConnections >= data.minConnections, {
    message: 'maxConnections must be greater than or equal to minConnections',
    path: ['maxConnections'],
  });

/**
 * Loads, parses, and validates the DatabaseConfig
 */
export function loadDatabaseConfig(envOverride?: any): DatabaseConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const url = EnvLoader.get('DATABASE_URL');
  
  // Validate postgres URL scheme
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new ValidationError('Invalid DATABASE_URL: must use postgresql:// or postgres:// scheme');
  }

  const minConns = Number(EnvLoader.getOrDefault('DB_POOL_MIN', EnvLoader.getOrDefault('DATABASE_MIN_CONNECTIONS', '5')));
  const rawMaxConns = Number(EnvLoader.getOrDefault('DB_POOL_MAX', EnvLoader.getOrDefault('DATABASE_MAX_CONNECTIONS', '20')));
  const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 10);
  // Pool max should be at least workerConcurrency + 2
  const maxConns = Math.max(rawMaxConns, workerConcurrency + 2);
  
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProd = nodeEnv === 'production';
  const enableSSL = isProd;
  const rejectUnauthorized = true;

  // Parse connection string
  let host = 'localhost';
  let port = 5432;
  let database = 'queueforge';
  let user = 'postgres';

  try {
    const parsedUrl = new URL(url);
    host = parsedUrl.hostname || host;
    port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : port;
    database = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : database;
    user = parsedUrl.username || user;
  } catch {
    throw new ValidationError('DATABASE_URL is not a valid URL');
  }

  const data = {
    url,
    maxConnections: maxConns,
    minConnections: minConns,
    connectionTimeoutMs: 30000,
    idleTimeoutMs: 900000,
    statementTimeoutMs: 60000,
    enableLogging: !isProd,
    enableSSL,
    rejectUnauthorized,
    poolMin: minConns,
    poolMax: maxConns,
    enableMetrics: true,
    connectionTimeout: 30000,
    idleTimeout: 900000,
    maxLifetime: 1800000,
    retryAttempts: 5,
    retryDelay: 2000,
    host,
    port,
    database,
    user,
  };

  const parsed = databaseConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid DatabaseConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data);
}
export { loadDatabaseConfig as getDatabaseConfig };
