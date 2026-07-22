import { z } from 'zod';
import { EnvLoader } from './env';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * QueueConfig interface representing pipeline job processor parameters
 */
export interface QueueConfig {
  readonly mainQueueName: string;
  readonly delayedQueueName: string;
  readonly dlqQueueName: string;
  readonly concurrency: number;
  readonly defaultJobTimeout: number;
  readonly staleInterval: number;
  readonly lockDuration: number;
  readonly lockRenewTime: number;
  readonly retryBackoff: {
    readonly type: 'exponential' | 'fixed';
    readonly delay: number;
  };
  readonly maxBackoff: number;
  readonly removeOnComplete: boolean | { readonly age: number } | number;
  readonly removeOnFail: boolean | { readonly age: number } | number;
  readonly defaultRepeatableKey: string;
  
  // Backward compatibility fields
  readonly name: string;
  readonly prefix: string;
  readonly defaultJobOptions: {
    readonly timeout: number;
    readonly removeOnComplete: boolean | number;
    readonly removeOnFail: boolean | number;
  };
  readonly limiter: {
    readonly max: number;
    readonly duration: number;
  };
  readonly settings: any;
}

const queueConfigSchema = z.object({
  mainQueueName: z.string().min(1),
  delayedQueueName: z.string().min(1),
  dlqQueueName: z.string().min(1),
  concurrency: z.number().int().min(1).max(100),
  defaultJobTimeout: z.number().int().positive(),
  staleInterval: z.number().int().positive(),
  lockDuration: z.number().int().positive(),
  lockRenewTime: z.number().int().positive(),
  retryBackoff: z.object({
    type: z.enum(['exponential', 'fixed']),
    delay: z.number().int().positive(),
  }),
  maxBackoff: z.number().int().positive(),
  removeOnComplete: z.any(),
  removeOnFail: z.any(),
  defaultRepeatableKey: z.string().min(1),
  name: z.string().min(1),
  prefix: z.string().min(1),
  defaultJobOptions: z.object({
    timeout: z.number().int().positive(),
    removeOnComplete: z.any(),
    removeOnFail: z.any(),
  }),
  limiter: z.object({
    max: z.number().int().positive(),
    duration: z.number().int().positive(),
  }),
  settings: z.any(),
});

/**
 * Loads and validates the QueueConfig
 */
export function loadQueueConfig(envOverride?: any): QueueConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const mainQueueName = EnvLoader.getOrDefault('MAIN_QUEUE_NAME', 'delivery-queue');
  const delayedQueueName = EnvLoader.getOrDefault('DELAYED_QUEUE_NAME', 'delivery-queue:delayed');
  const dlqQueueName = EnvLoader.getOrDefault('DLQ_QUEUE_NAME', 'delivery-queue:dlq');
  const concurrency = Number(EnvLoader.getOrDefault('QUEUE_CONCURRENCY', '10'));
  
  const attempts = Number(EnvLoader.getOrDefault('MAX_RETRIES', '5'));
  if (attempts < 1 || attempts > 10) {
    throw new ValidationError('MAX_RETRIES configuration must be between 1 and 10');
  }

  const baseMs = Number(EnvLoader.getOrDefault('BACKOFF_BASE_MS', '1000'));
  if (baseMs < 100 || baseMs > 100000) {
    throw new ValidationError('BACKOFF_BASE_MS configuration must be between 100 and 100000');
  }

  const staleTimeout = Number(EnvLoader.getOrDefault('STALE_JOB_TIMEOUT_MS', '30000'));
  if (staleTimeout <= 0) {
    throw new ValidationError('STALE_JOB_TIMEOUT_MS must be positive');
  }

  const data = {
    mainQueueName,
    delayedQueueName,
    dlqQueueName,
    concurrency,
    defaultJobTimeout: staleTimeout,
    staleInterval: 5000,
    lockDuration: 30000,
    lockRenewTime: 15000,
    retryBackoff: {
      type: 'exponential' as const,
      delay: baseMs,
    },
    maxBackoff: 3600000,
    removeOnComplete: { age: 86400 },
    removeOnFail: false,
    defaultRepeatableKey: 'repeatable-key',
    name: mainQueueName,
    prefix: 'bull',
    defaultJobOptions: {
      timeout: 30000,
      removeOnComplete: 100,
      removeOnFail: 500,
    },
    limiter: {
      max: 1000,
      duration: 1000,
    },
    settings: {
      maxRetriesPerJob: attempts,
      stalledInterval: staleTimeout,
      maxStalledCount: 2,
      defaultJobOptions: {
        attempts,
        backoff: {
          type: 'exponential' as const,
          delay: baseMs,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
        timeout: 30000,
      },
    },
  };

  const parsed = queueConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid QueueConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as QueueConfig;
}
export { loadQueueConfig as getQueueConfig };
export { QueueConfig as QueueSettings };
