import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * DaemonConfig interface representing background cron loops parameters
 */
export interface DaemonConfig {
  readonly enabled: boolean;
  readonly recovery: {
    readonly enabled: boolean;
    readonly intervalMs: number;
    readonly dlqCheckIntervalMs: number;
  };
  readonly health: {
    readonly enabled: boolean;
    readonly intervalMs: number;
  };
  readonly metrics: {
    readonly enabled: boolean;
    readonly collectionIntervalMs: number;
  };
  readonly gracefulShutdownTimeoutMs: number;
}

const daemonConfigSchema = z.object({
  enabled: z.boolean(),
  recovery: z.object({
    enabled: z.boolean(),
    intervalMs: z.number().int().positive(),
    dlqCheckIntervalMs: z.number().int().positive(),
  }),
  health: z.object({
    enabled: z.boolean(),
    intervalMs: z.number().int().positive(),
  }),
  metrics: z.object({
    enabled: z.boolean(),
    collectionIntervalMs: z.number().int().positive(),
  }),
  gracefulShutdownTimeoutMs: z.number().int().positive(),
});

/**
 * Loads and validates the DaemonConfig
 */
export function loadDaemonConfig(): DaemonConfig {
  const data = {
    enabled: true,
    recovery: {
      enabled: true,
      intervalMs: 60000,
      dlqCheckIntervalMs: 30000,
    },
    health: {
      enabled: true,
      intervalMs: 30000,
    },
    metrics: {
      enabled: true,
      collectionIntervalMs: 10000,
    },
    gracefulShutdownTimeoutMs: 30000,
  };

  const parsed = daemonConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid DaemonConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as DaemonConfig;
}
