import { z } from 'zod';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * QuotaTier representing tier limits structure
 */
export interface QuotaTier {
  readonly tier: string;
  readonly limits: Record<string, number>;
}

/**
 * RateLimitingConfig interface representing sliding-window counter quota thresholds and IP whitelists
 */
export interface RateLimitingConfig {
  readonly enabled: boolean;
  readonly quotaTiers: QuotaTier[];
  readonly global: {
    readonly requestsPerMinute: number;
    readonly connectionsLimit: number;
  };
  readonly perApiKey: {
    readonly requestsPerHour: number;
  };
  readonly perEndpoint: Record<string, number>;
  readonly whitelist: string[];
  readonly blacklist: string[];
  readonly gracePeriodMs: number;
}

const rateLimitingConfigSchema = z.object({
  enabled: z.boolean(),
  quotaTiers: z.array(
    z.object({
      tier: z.string().min(1),
      limits: z.record(z.number().int().nonnegative()),
    })
  ),
  global: z.object({
    requestsPerMinute: z.number().int().positive(),
    connectionsLimit: z.number().int().positive(),
  }),
  perApiKey: z.object({
    requestsPerHour: z.number().int().positive(),
  }),
  perEndpoint: z.record(z.number().int().positive()),
  whitelist: z.array(z.string()),
  blacklist: z.array(z.string()),
  gracePeriodMs: z.number().int().nonnegative(),
});

/**
 * Loads and validates the RateLimitingConfig
 */
export function loadRateLimitingConfig(): RateLimitingConfig {
  const data = {
    enabled: true,
    quotaTiers: [
      {
        tier: 'Free',
        limits: {
          resultsPerHour: 100,
        },
      },
      {
        tier: 'Pro',
        limits: {
          resultsPerHour: 10000,
        },
      },
      {
        tier: 'Enterprise',
        limits: {
          resultsPerHour: 999999999, // unlimited
        },
      },
    ],
    global: {
      requestsPerMinute: 10000,
      connectionsLimit: 1000,
    },
    perApiKey: {
      requestsPerHour: 3600,
    },
    perEndpoint: {
      '/api/v1/ingest': 5000,
    },
    whitelist: ['127.0.0.1'],
    blacklist: [],
    gracePeriodMs: 0,
  };

  const parsed = rateLimitingConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid RateLimitingConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as RateLimitingConfig;
}
