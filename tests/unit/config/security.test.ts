import {
  getSecurityConfig,
  JWT_ALGORITHM,
  HMAC_ALGORITHM,
  RATE_LIMIT_WINDOW_MINUTES,
} from '../../../src/config/security';
import { EnvConfig } from '../../../src/config/env';

describe('Config: security.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    API_KEY_SECRET: 'api_key_secret_key_secret_key_secret_key_secret_key',
    JWT_SECRET: 'jwt_secret_key_secret_key_secret_key_secret_key_secret_key',
    HMAC_SECRET: 'hmac_secret_key_secret_key_secret_key_secret_key_secret_key',
    RATE_LIMIT_REQUESTS_PER_MINUTE: 100,
  };

  it('should export correct security algorithms and timing constants', () => {
    expect(JWT_ALGORITHM).toBe('HS256');
    expect(HMAC_ALGORITHM).toBe('sha256');
    expect(RATE_LIMIT_WINDOW_MINUTES).toBe(15);
  });

  it('should successfully build SecurityConfig from valid parameters', () => {
    const config = getSecurityConfig(baseMockEnv as EnvConfig);
    expect(config.apiKeySecret).toBe(baseMockEnv.API_KEY_SECRET);
    expect(config.jwtExpiryHours).toBe(24);
    expect(config.rateLimitRequestsPerMinute).toBe(100);
    expect(config.corsOrigins).toContain('http://localhost:3000');
  });

  it('should throw error if any secrets are shorter than 32 characters', () => {
    const badJwt = { ...baseMockEnv, JWT_SECRET: 'short-secret-value' };
    expect(() => getSecurityConfig(badJwt as EnvConfig)).toThrow(/JWT_SECRET must be/);
  });

  it('should throw error if production and secrets contain dummy values', () => {
    const badProdEnv = {
      ...baseMockEnv,
      NODE_ENV: 'production',
      JWT_SECRET: 'dummy-secret-key-min-32-characters-long',
    };
    expect(() => getSecurityConfig(badProdEnv as EnvConfig)).toThrow(/Production configuration/);
  });

  it('should retrieve CORS origins list parsed from environment in production', () => {
    const prodEnv = {
      ...baseMockEnv,
      NODE_ENV: 'production',
      API_KEY_SECRET: 'production_api_key_secure_123456789012',
      JWT_SECRET: 'production_jwt_key_secure_1234567890123',
      HMAC_SECRET: 'production_hmac_key_secure_123456789012',
    };
    process.env.CORS_ORIGINS = 'https://oneinbox.com, https://agent.oneinbox.com';

    const config = getSecurityConfig(prodEnv as EnvConfig);
    expect(config.corsOrigins).toEqual(['https://oneinbox.com', 'https://agent.oneinbox.com']);

    delete process.env.CORS_ORIGINS;
  });

  it('should freeze the returned config object', () => {
    const config = getSecurityConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
