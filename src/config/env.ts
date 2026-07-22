import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * EnvLoader class providing static helper methods for environment variable retrieval and type casting
 */
export class EnvLoader {
  private static isLoaded = false;

  /**
   * Loads environment-specific .env files. Only runs once.
   * If NODE_ENV is development/test, attempts to load from workspace root.
   */
  public static load(): void {
    if (this.isLoaded) return;

    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Load environment-specific env file (.env.dev, .env.test, .env.prod)
    let envFile = '.env';
    if (nodeEnv === 'development' || nodeEnv === 'dev') {
      envFile = '.env.dev';
    } else if (nodeEnv === 'test') {
      envFile = '.env.test';
    } else if (nodeEnv === 'production' || nodeEnv === 'prod') {
      envFile = '.env.prod';
    }

    const envPath = path.resolve(process.cwd(), envFile);
    
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      // Fallback to standard .env
      const defaultEnvPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(defaultEnvPath)) {
        dotenv.config({ path: defaultEnvPath });
      }
    }

    this.isLoaded = true;
  }

  /**
   * Retrieves an environment variable, throwing a ValidationError if it is missing
   * @param key - The environment variable key name
   */
  public static get(key: string): string {
    this.load();
    const val = process.env[key];
    if (val === undefined || val === null || val.trim() === '') {
      throw new ValidationError(`Required environment variable "${key}" is missing`);
    }
    return val;
  }

  /**
   * Retrieves an environment variable, returning a default value if missing
   * @param key - The environment variable key name
   * @param defaultValue - Fallback value
   */
  public static getOrDefault(key: string, defaultValue: string): string {
    this.load();
    const val = process.env[key];
    if (val === undefined || val === null || val.trim() === '') {
      return defaultValue;
    }
    return val;
  }

  /**
   * Retrieves and parses an environment variable as a number, throwing on failure
   * @param key - The environment variable key name
   */
  public static getNumber(key: string): number {
    const val = this.get(key);
    const num = Number(val);
    if (isNaN(num)) {
      throw new ValidationError(`Environment variable "${key}" must be a valid number, got "${val}"`);
    }
    return num;
  }

  /**
   * Retrieves and parses an environment variable as a boolean
   * @param key - The environment variable key name
   */
  public static getBoolean(key: string): boolean {
    this.load();
    const val = process.env[key];
    if (val === undefined || val === null) return false;
    return ['true', '1', 'yes'].includes(val.toLowerCase());
  }

  /**
   * Retrieves an environment variable and splits it by comma into an array
   * @param key - The environment variable key name
   */
  public static getAsArray(key: string): string[] {
    const val = this.getOrDefault(key, '');
    if (val === '') return [];
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
}

// Preprocessor to safely convert environment strings into booleans
const envBoolean = z.preprocess((val) => {
  if (typeof val === 'string') {
    return ['true', '1', 'yes'].includes(val.toLowerCase());
  }
  return Boolean(val);
}, z.boolean());

/**
 * Zod schema defining all environment parameters for QueueForge
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    DATABASE_URL: z
      .string()
      .url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),
    REDIS_URL: z
      .string()
      .url({ message: 'REDIS_URL must be a valid Redis connection URL' })
      .default('redis://localhost:6379'),
    API_KEY_SECRET: z
      .string()
      .min(32, { message: 'API_KEY_SECRET must be at least 32 characters long' }),
    JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters long' }),
    HMAC_SECRET: z.string().min(32, { message: 'HMAC_SECRET must be at least 32 characters long' }),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://localhost:4317'),
    PROMETHEUS_PORT: z.coerce.number().int().min(1).max(65535).default(9090),
    JAEGER_ENDPOINT: z.string().url().default('http://localhost:14268/api/traces'),
    APP_NAME: z.string().default('QueueForge'),
    APP_VERSION: z.string().default('1.0.0'),
    ENVIRONMENT: z.string().default('development'),
    MAX_RETRIES: z.coerce.number().int().min(1).max(10).default(5),
    BACKOFF_BASE_MS: z.coerce.number().int().min(100).max(10000).default(1000),
    CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().min(1).max(100).default(50),
    CIRCUIT_BREAKER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(60000),
    RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().int().min(1).max(10000).default(1000),
    DB_POOL_MIN: z.coerce.number().int().min(1).max(50).default(2),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    REDIS_POOL_MIN: z.coerce.number().int().min(1).max(50).default(2),
    REDIS_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
    WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(10).max(10000).default(100),
    STALE_JOB_TIMEOUT_MS: z.coerce.number().int().min(5000).max(300000).default(30000),
    HEARTBEAT_INTERVAL_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
    GRACEFUL_SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(10000).max(600000).default(60000),
    ENABLE_AUDIT_LOGGING: envBoolean.default(true),
    AUDIT_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(730),
    OTEL_TRACE_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1.0),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        const secrets = [data.JWT_SECRET, data.API_KEY_SECRET, data.HMAC_SECRET];
        const hasDummy = secrets.some(
          (secret) =>
            secret.includes('test') ||
            secret.includes('dummy') ||
            secret.includes('your-') ||
            secret.includes('super-secret')
        );
        return !hasDummy;
      }
      return true;
    },
    {
      message: 'Production configurations must not use test or dummy secrets',
      path: ['JWT_SECRET'],
    }
  )
  .refine(
    (data) => {
      return data.DB_POOL_MAX >= data.DB_POOL_MIN;
    },
    {
      message: 'DB_POOL_MAX must be greater than or equal to DB_POOL_MIN',
      path: ['DB_POOL_MAX'],
    }
  )
  .refine(
    (data) => {
      return data.REDIS_POOL_MAX >= data.REDIS_POOL_MIN;
    },
    {
      message: 'REDIS_POOL_MAX must be greater than or equal to REDIS_POOL_MIN',
      path: ['REDIS_POOL_MAX'],
    }
  );

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Loads environment configurations and parses/validates them.
 */
export function parseEnv(): EnvConfig {
  EnvLoader.load();
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    throw new ValidationError(
      `Environment validation failed:\n- ${errorDetails.join('\n- ')}`,
      result.error.errors
    );
  }

  return result.data;
}
export { EnvLoader as EnvConfigLoader };
export { EnvConfig as EnvVariables };
