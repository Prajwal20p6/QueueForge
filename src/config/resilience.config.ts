import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * ResilienceConfig interface representing circuit breaker, bulkhead, backpressure and retry settings
 */
export interface ResilienceConfig {
  readonly circuitBreaker: {
    readonly enabled: boolean;
    readonly threshold: number;
    readonly timeout: number;
    readonly monitoringPeriod: number;
    readonly rollingCountTimeout: number;
  };
  readonly bulkhead: {
    readonly enabled: boolean;
    readonly maxConcurrent: number;
    readonly maxQueueSize: number;
    readonly timeout: number;
  };
  readonly backpressure: {
    readonly enabled: boolean;
    readonly threshold: number;
    readonly shedPercentage: number;
  };
  readonly retry: {
    readonly enabled: boolean;
    readonly maxAttempts: number;
    readonly initialDelayMs: number;
    readonly maxDelayMs: number;
    readonly jitterFactor: number;
  };
  readonly timeout: {
    readonly defaultMs: number;
    readonly httpMs: number;
    readonly databaseMs: number;
    readonly redisMs: number;
  };

  // Backward compatibility fields
  readonly circuitBreakerFailureThreshold: number;
  readonly circuitBreakerResetTimeoutMs: number;
  readonly retryMaxAttempts: number;
  readonly retryBackoffBaseMs: number;
  readonly bulkheadPoolSizeDatabase: number;
  readonly bulkheadPoolSizeRedis: number;
  readonly backpressureQueueDepthThreshold: number;
  readonly bulkheadPoolSizeWebhook: number;
  readonly bulkheadPoolSizeQueue: number;
  readonly circuitBreakerThreshold: number;
  readonly circuitBreakerTimeout: number;
  readonly circuitBreakerVolumeThreshold: number;
  readonly maxRetries: number;
  readonly backoffBaseMs: number;
  readonly backoffMaxMs: number;
  readonly backoffJitterFactor: number;
  readonly permanentStatusCodes: number[];
  readonly retryableStatusCodes: number[];
  readonly backpressureAlarmThreshold: number;
  readonly backpressureSheddingStrategy: string;
  readonly circuitBreakerEnabled: boolean;
  readonly bulkheadEnabled: boolean;
  readonly backpressureEnabled: boolean;
  readonly retryEnabled: boolean;
  readonly timeoutEnabled: boolean;
}

const resilienceConfigSchema = z.object({
  circuitBreaker: z.object({
    enabled: z.boolean(),
    threshold: z.number().int().positive(),
    timeout: z.number().int().positive(),
    monitoringPeriod: z.number().int().positive(),
    rollingCountTimeout: z.number().int().positive(),
  }),
  bulkhead: z.object({
    enabled: z.boolean(),
    maxConcurrent: z.number().int().positive(),
    maxQueueSize: z.number().int().positive(),
    timeout: z.number().int().positive(),
  }),
  backpressure: z.object({
    enabled: z.boolean(),
    threshold: z.number().int().positive(),
    shedPercentage: z.number().min(0).max(100),
  }),
  retry: z.object({
    enabled: z.boolean(),
    maxAttempts: z.number().int().positive(),
    initialDelayMs: z.number().int().positive(),
    maxDelayMs: z.number().int().positive(),
    jitterFactor: z.number().min(0).max(1),
  }),
  timeout: z.object({
    defaultMs: z.number().int().positive(),
    httpMs: z.number().int().positive(),
    databaseMs: z.number().int().positive(),
    redisMs: z.number().int().positive(),
  }),
  circuitBreakerFailureThreshold: z.number().int().positive(),
  circuitBreakerResetTimeoutMs: z.number().int().positive(),
  retryMaxAttempts: z.number().int().positive(),
  retryBackoffBaseMs: z.number().int().positive(),
  bulkheadPoolSizeDatabase: z.number().int().positive(),
  bulkheadPoolSizeRedis: z.number().int().positive(),
  backpressureQueueDepthThreshold: z.number().int().positive(),
  bulkheadPoolSizeWebhook: z.number().int().positive(),
  bulkheadPoolSizeQueue: z.number().int().positive(),
  circuitBreakerThreshold: z.number().int().positive(),
  circuitBreakerTimeout: z.number().int().positive(),
  circuitBreakerVolumeThreshold: z.number().int().positive(),
  maxRetries: z.number().int().positive(),
  backoffBaseMs: z.number().int().positive(),
  backoffMaxMs: z.number().int().positive(),
  backoffJitterFactor: z.number().min(0).max(1),
  permanentStatusCodes: z.array(z.number().int().positive()),
  retryableStatusCodes: z.array(z.number().int().positive()),
  backpressureAlarmThreshold: z.number().int().positive(),
  backpressureSheddingStrategy: z.string().min(1),
  circuitBreakerEnabled: z.boolean(),
  bulkheadEnabled: z.boolean(),
  backpressureEnabled: z.boolean(),
  retryEnabled: z.boolean(),
  timeoutEnabled: z.boolean(),
});

/**
 * Loads and validates the ResilienceConfig
 */
export function loadResilienceConfig(envOverride?: any): ResilienceConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const cbThreshold = Number(process.env.CIRCUIT_BREAKER_THRESHOLD || 5);
  if (cbThreshold < 1 || cbThreshold > 100) {
    throw new ValidationError('CIRCUIT_BREAKER_THRESHOLD must be between 1 and 100');
  }
  
  const cbTimeoutMs = Number(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || 60000);
  const cbTimeoutSec = Math.round(cbTimeoutMs / 1000);

  const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 10);
  const dbPoolMax = Number(process.env.DB_POOL_MAX || 10);
  const redisPoolMax = Number(process.env.REDIS_POOL_MAX || 15);
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isTestEnv = nodeEnv === 'test';

  const webhookPool = isTestEnv ? 2 : workerConcurrency;
  const dbPool = isTestEnv ? 2 : dbPoolMax;
  const queuePool = isTestEnv ? 2 : redisPoolMax;

  const retryableStatusCodes = Object.freeze([408, 429, 500, 502, 503, 504]) as unknown as number[];
  const permanentStatusCodes = Object.freeze([400, 401, 403, 404, 409, 422]) as unknown as number[];

  const data = {
    circuitBreaker: {
      enabled: true,
      threshold: cbThreshold,
      timeout: cbTimeoutMs,
      monitoringPeriod: 120000,
      rollingCountTimeout: 10000,
    },
    bulkhead: {
      enabled: true,
      maxConcurrent: 100,
      maxQueueSize: 1000,
      timeout: 30000,
    },
    backpressure: {
      enabled: true,
      threshold: 1000,
      shedPercentage: 10,
    },
    retry: {
      enabled: true,
      maxAttempts: Number(process.env.MAX_RETRIES || 5),
      initialDelayMs: Number(process.env.BACKOFF_BASE_MS || 1000),
      maxDelayMs: 3600000,
      jitterFactor: 0.1,
    },
    timeout: {
      defaultMs: 30000,
      httpMs: 30000,
      databaseMs: 60000,
      redisMs: 10000,
    },
    circuitBreakerFailureThreshold: cbThreshold,
    circuitBreakerResetTimeoutMs: cbTimeoutMs,
    retryMaxAttempts: Number(process.env.MAX_RETRIES || 5),
    retryBackoffBaseMs: Number(process.env.BACKOFF_BASE_MS || 1000),
    bulkheadPoolSizeDatabase: dbPool,
    bulkheadPoolSizeRedis: queuePool,
    backpressureQueueDepthThreshold: Number(process.env.BACKPRESSURE_QUEUE_DEPTH_THRESHOLD || 1000),
    bulkheadPoolSizeWebhook: webhookPool,
    bulkheadPoolSizeQueue: queuePool,
    circuitBreakerThreshold: cbThreshold,
    circuitBreakerTimeout: cbTimeoutSec,
    circuitBreakerVolumeThreshold: 3,
    maxRetries: Number(process.env.MAX_RETRIES || 5),
    backoffBaseMs: Number(process.env.BACKOFF_BASE_MS || 1000),
    backoffMaxMs: 3600000,
    backoffJitterFactor: 0.1,
    permanentStatusCodes,
    retryableStatusCodes,
    backpressureAlarmThreshold: Number(process.env.BACKPRESSURE_QUEUE_DEPTH_THRESHOLD || 1000),
    backpressureSheddingStrategy: 'percentage',
    circuitBreakerEnabled: true,
    bulkheadEnabled: true,
    backpressureEnabled: true,
    retryEnabled: true,
    timeoutEnabled: true,
  };

  const parsed = resilienceConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid ResilienceConfig settings structure', parsed.error.errors);
  }

  const result = parsed.data as any;
  // Deep-freeze arrays
  if (result.retryableStatusCodes) Object.freeze(result.retryableStatusCodes);
  if (result.permanentStatusCodes) Object.freeze(result.permanentStatusCodes);

  return Object.freeze(result) as ResilienceConfig;
}
export { loadResilienceConfig as getResilienceConfig };
export { ResilienceConfig as ResilienceSettings };
