import { SecurityConfig } from '../../config/security';

export interface RateLimitConfig {
  defaultLimit: number;
  defaultWindowSeconds: number;
  perEndpointLimits?: Record<string, number>;
  perApiKeyLimits?: Record<string, number>;
  perUserLimits?: Record<string, number>;
}

export interface RateLimitThresholds {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

// Global Defaults Constants
export const DEFAULT_GLOBAL_LIMIT = 1000;
export const DEFAULT_GLOBAL_WINDOW_SECONDS = 60; // 1000 requests per minute
export const DEFAULT_ENDPOINT_LIMIT = 100;
export const DEFAULT_ENDPOINT_WINDOW_SECONDS = 60; // 100 requests per minute

/**
 * Returns thresholds matching a customer tier.
 */
export function getThresholds(
  config: SecurityConfig,
  tier: 'free' | 'premium' | 'enterprise'
): RateLimitThresholds {
  // Support environment-based customization
  const requestsPerMinuteEnv = config.rateLimitRequestsPerMinute || 60;

  if (tier === 'enterprise') {
    return {
      requestsPerMinute: 1000000,
      requestsPerHour: 10000000,
      requestsPerDay: 100000000,
    };
  }

  if (tier === 'premium') {
    return {
      requestsPerMinute: Math.max(300, requestsPerMinuteEnv),
      requestsPerHour: 10000,
      requestsPerDay: 100000,
    };
  }

  // default to free
  return {
    requestsPerMinute: Math.min(60, requestsPerMinuteEnv),
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  };
}

/**
 * Evaluates rate limit thresholds applying cascading overrides rules:
 * endpoint override > user override > apiKey override > default configuration.
 */
export function getRateLimitThreshold(
  config: RateLimitConfig,
  endpoint?: string,
  apiKey?: string,
  userId?: string
): { limit: number; windowSeconds: number } {
  // 1. Endpoint override check
  if (endpoint && config.perEndpointLimits && config.perEndpointLimits[endpoint] !== undefined) {
    return {
      limit: config.perEndpointLimits[endpoint],
      windowSeconds: config.defaultWindowSeconds,
    };
  }

  // 2. User override check
  if (userId && config.perUserLimits && config.perUserLimits[userId] !== undefined) {
    return {
      limit: config.perUserLimits[userId],
      windowSeconds: config.defaultWindowSeconds,
    };
  }

  // 3. API Key override check
  if (apiKey && config.perApiKeyLimits && config.perApiKeyLimits[apiKey] !== undefined) {
    return {
      limit: config.perApiKeyLimits[apiKey],
      windowSeconds: config.defaultWindowSeconds,
    };
  }

  // 4. Default bounds
  return {
    limit: config.defaultLimit,
    windowSeconds: config.defaultWindowSeconds,
  };
}
