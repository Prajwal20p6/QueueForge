import { z } from 'zod';
import { EnvLoader } from './env';

import { ValidationError } from '../shared/errors/validation-error';

/**
 * SecurityConfig interface representing secrets, tokens, CORS and Rate-Limiter keys
 */
export interface SecurityConfig {
  readonly jwtSecret: string;
  readonly jwtExpiryMs: number;
  readonly jwtAlgorithm: string;
  readonly apiKeyHeader: string;
  readonly hmacSecret: string;
  readonly hmacAlgorithm: string;
  readonly enableCors: boolean;
  readonly corsOrigins: string[];
  readonly enableCsrfProtection: boolean;
  readonly passwordMinLength: number;
  readonly enableHelmet: boolean;
  readonly trustProxy: boolean;
  readonly enableRateLimiting: boolean;
  readonly rateLimitWindowMs: number;
  readonly rateLimitMaxRequests: number;

  // Backward compatibility fields
  readonly apiKeySecret: string;
  readonly tokenExpirySeconds: number;
  readonly corsOrigin: string;
  readonly rateLimitWindow: number;
  readonly rateLimitMax: number;
  readonly jwtExpiryHours: number;
  readonly rateLimitRequestsPerMinute: number;
  readonly enableHMACValidation?: boolean;
  readonly enableRequestSigning?: boolean;
  readonly enableTLS?: boolean;
  readonly enableCORS?: boolean;
  readonly corsCredentials?: boolean;
}

const securityConfigSchema = z.object({
  jwtSecret: z.string().min(32, { message: 'jwtSecret must be at least 32 characters' }),
  jwtExpiryMs: z.number().int().positive(),
  jwtAlgorithm: z.string().min(1),
  apiKeyHeader: z.string().min(1),
  hmacSecret: z.string().min(32, { message: 'hmacSecret must be at least 32 characters' }),
  hmacAlgorithm: z.string().min(1),
  enableCors: z.boolean(),
  corsOrigins: z.array(z.string()),
  enableCsrfProtection: z.boolean(),
  passwordMinLength: z.number().int().min(8),
  enableHelmet: z.boolean(),
  trustProxy: z.boolean(),
  enableRateLimiting: z.boolean(),
  rateLimitWindowMs: z.number().int().positive(),
  rateLimitMaxRequests: z.number().int().positive(),
  apiKeySecret: z.string().min(32, { message: 'apiKeySecret must be at least 32 characters' }),
  tokenExpirySeconds: z.number().int().positive(),
  corsOrigin: z.string(),
  rateLimitWindow: z.number().int().positive(),
  rateLimitMax: z.number().int().positive(),
  jwtExpiryHours: z.number().int().positive(),
  rateLimitRequestsPerMinute: z.number().int().positive(),
  enableHMACValidation: z.boolean().optional(),
  enableRequestSigning: z.boolean().optional(),
  enableTLS: z.boolean().optional(),
  enableCORS: z.boolean().optional(),
  corsCredentials: z.boolean().optional(),
});

/**
 * Loads and validates the SecurityConfig
 */
export function loadSecurityConfig(envOverride?: any): SecurityConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const jwtSecret = EnvLoader.get('JWT_SECRET');
  const hmacSecret = EnvLoader.get('HMAC_SECRET');
  const apiKeySecret = EnvLoader.getOrDefault('API_KEY_SECRET', EnvLoader.getOrDefault('API_KEY', jwtSecret));

  // Pre-schema explicit validations for clear error messages
  if (jwtSecret.length < 32) {
    throw new ValidationError('JWT_SECRET must be at least 32 characters');
  }
  if (hmacSecret.length < 32) {
    throw new ValidationError('HMAC_SECRET must be at least 32 characters');
  }
  if (apiKeySecret.length < 32) {
    throw new ValidationError('API_KEY_SECRET must be at least 32 characters');
  }

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProd = nodeEnv === 'production';

  // Production safety: reject explicit placeholder values
  if (isProd) {
    const dummyPatterns = ['dummy_secret', 'test_placeholder', 'changeme_now', 'your_secret_here'];
    for (const secret of [jwtSecret, hmacSecret, apiKeySecret]) {
      const lower = secret.toLowerCase();
      if (dummyPatterns.some((p) => lower.includes(p))) {
        throw new ValidationError('Production configuration must not contain dummy or test secrets');
      }
    }
  }

  const corsOrigins = EnvLoader.getAsArray('CORS_ORIGINS');
  if (corsOrigins.length === 0) {
    corsOrigins.push('http://localhost:3000');
  }

  // Validate CORS origins are valid URLs
  for (const origin of corsOrigins) {
    if (origin !== '*' && !origin.startsWith('http://') && !origin.startsWith('https://')) {
      throw new ValidationError(`CORS origin URL must be a valid http/https format: ${origin}`);
    }
  }

  const data = {
    jwtSecret,
    jwtExpiryMs: 86400000,
    jwtAlgorithm: 'HS256',
    apiKeyHeader: 'X-API-Key',
    hmacSecret,
    hmacAlgorithm: 'sha256',
    enableCors: true,
    corsOrigins,
    enableCsrfProtection: isProd,
    passwordMinLength: 12,
    enableHelmet: true,
    trustProxy: false,
    enableRateLimiting: true,
    rateLimitWindowMs: 60000,
    rateLimitMaxRequests: 100,
    apiKeySecret,
    tokenExpirySeconds: 86400,
    corsOrigin: corsOrigins[0],
    rateLimitWindow: 60,
    rateLimitMax: 100,
    jwtExpiryHours: 24,
    rateLimitRequestsPerMinute: 100,
    enableHMACValidation: false,
    enableRequestSigning: false,
    enableTLS: false,
    enableCORS: false,
    corsCredentials: false,
  };

  const parsed = securityConfigSchema.safeParse(data);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Invalid SecurityConfig settings structure: ${errorDetails}`, parsed.error.errors);
  }

  return Object.freeze(parsed.data) as SecurityConfig;
}
export { loadSecurityConfig as getSecurityConfig };
export { SecurityConfig as SecuritySettings };
