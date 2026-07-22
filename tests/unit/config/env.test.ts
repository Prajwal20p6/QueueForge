jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

import { parseEnv } from '../../../src/config/env';
import { ValidationError } from '../../../src/shared/errors/validation-error';

describe('Config: env.ts', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  afterAll(() => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  const validEnvVars = {
    NODE_ENV: 'development',
    PORT: '4000',
    LOG_LEVEL: 'debug',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/queueforge',
    REDIS_URL: 'redis://localhost:6379',
    API_KEY_SECRET: 'api_key_secret_key_secret_key_secret_key_secret_key',
    JWT_SECRET: 'jwt_secret_key_secret_key_secret_key_secret_key_secret_key',
    HMAC_SECRET: 'hmac_secret_key_secret_key_secret_key_secret_key_secret_key',
  };

  it('should parse and default valid environment variables', () => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, validEnvVars);
    const env = parseEnv();
    expect(env.PORT).toBe(4000);
    expect(env.LOG_LEVEL).toBe('debug');
    expect(env.ENABLE_AUDIT_LOGGING).toBe(true);
    expect(env.MAX_RETRIES).toBe(5);
  });

  it('should throw ValidationError if DATABASE_URL is missing', () => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    const invalid = { ...validEnvVars };
    delete (invalid as any).DATABASE_URL;
    Object.assign(process.env, invalid);
    expect(() => parseEnv()).toThrow(ValidationError);
  });

  it('should throw ValidationError if API_KEY_SECRET is too short (<32)', () => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    const invalid = {
      ...validEnvVars,
      API_KEY_SECRET: 'too-short',
    };
    Object.assign(process.env, invalid);
    expect(() => parseEnv()).toThrow(ValidationError);
  });

  it('should throw ValidationError if dummy secrets are used in production', () => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    const invalid = {
      ...validEnvVars,
      NODE_ENV: 'production',
      JWT_SECRET: 'super-secret-jwt-key-change-this-in-production', // dummy default value
    };
    Object.assign(process.env, invalid);
    expect(() => parseEnv()).toThrow(ValidationError);
  });

  describe('EnvLoader', () => {
    const { EnvConfigLoader } = require('../../../src/config/env');

    it('should load env var values using EnvLoader methods', () => {
      process.env.TEST_STR = 'hello';
      process.env.TEST_NUM = '123';
      process.env.TEST_BOOL = 'true';
      process.env.TEST_ARR = 'a,b,c';

      expect(EnvConfigLoader.get('TEST_STR')).toBe('hello');
      expect(EnvConfigLoader.getOrDefault('TEST_MISSING', 'default')).toBe('default');
      expect(EnvConfigLoader.getNumber('TEST_NUM')).toBe(123);
      expect(EnvConfigLoader.getBoolean('TEST_BOOL')).toBe(true);
      expect(EnvConfigLoader.getAsArray('TEST_ARR')).toEqual(['a', 'b', 'c']);
    });
  });
});
