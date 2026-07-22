import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * WorkerConfig interface representing BullMQ pipeline process parameters
 */
export interface WorkerConfig {
  readonly enabled: boolean;
  readonly concurrency: number;
  readonly pollIntervalMs: number;
  readonly maxInFlightJobs: number;
  readonly heartbeatIntervalMs: number;
  readonly heartbeatTTLMs: number;
  readonly gracefulShutdownTimeoutMs: number;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly enableDeadletterQueue: boolean;
  readonly enableMetrics: boolean;
  readonly enableTracing: boolean;
}

const workerConfigSchema = z.object({
  enabled: z.boolean(),
  concurrency: z.number().int().positive(),
  pollIntervalMs: z.number().int().positive(),
  maxInFlightJobs: z.number().int().positive(),
  heartbeatIntervalMs: z.number().int().positive(),
  heartbeatTTLMs: z.number().int().positive(),
  gracefulShutdownTimeoutMs: z.number().int().positive(),
  timeout: z.number().int().positive(),
  maxRetries: z.number().int().positive(),
  enableDeadletterQueue: z.boolean(),
  enableMetrics: z.boolean(),
  enableTracing: z.boolean(),
});

/**
 * Loads and validates the WorkerConfig
 */
export function loadWorkerConfig(): WorkerConfig {
  const data = {
    enabled: true,
    concurrency: 10,
    pollIntervalMs: 1000,
    maxInFlightJobs: 1000,
    heartbeatIntervalMs: 10000,
    heartbeatTTLMs: 30000,
    gracefulShutdownTimeoutMs: 60000,
    timeout: 30000,
    maxRetries: 5,
    enableDeadletterQueue: true,
    enableMetrics: true,
    enableTracing: true,
  };

  const parsed = workerConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid WorkerConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as WorkerConfig;
}
