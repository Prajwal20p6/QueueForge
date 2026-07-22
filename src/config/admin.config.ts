import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * AdminConfig interface representing dashboard control console routing path rules
 */
export interface AdminConfig {
  readonly enabled: boolean;
  readonly basePath: string;
  readonly authentication: {
    readonly required: boolean;
    readonly roleRequired: string;
  };
  readonly auditLogging: {
    readonly enabled: boolean;
    readonly logSensitiveOperations: boolean;
  };
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly windowMs: number;
    readonly maxRequests: number;
  };
}

const adminConfigSchema = z.object({
  enabled: z.boolean(),
  basePath: z.string().min(1).startsWith('/'),
  authentication: z.object({
    required: z.boolean(),
    roleRequired: z.string().min(1),
  }),
  auditLogging: z.object({
    enabled: z.boolean(),
    logSensitiveOperations: z.boolean(),
  }),
  rateLimit: z.object({
    enabled: z.boolean(),
    windowMs: z.number().int().positive(),
    maxRequests: z.number().int().positive(),
  }),
});

/**
 * Loads and validates the AdminConfig
 */
export function loadAdminConfig(): AdminConfig {
  const data = {
    enabled: true,
    basePath: '/admin',
    authentication: {
      required: true,
      roleRequired: 'admin',
    },
    auditLogging: {
      enabled: true,
      logSensitiveOperations: true,
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100,
    },
  };

  const parsed = adminConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid AdminConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as AdminConfig;
}
