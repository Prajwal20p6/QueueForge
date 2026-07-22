import { getRedisConfig } from '../../../src/config/redis';
import { EnvConfig } from '../../../src/config/env';

describe('Config: redis.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    REDIS_URL: 'redis://:mypassword@redis-server:7000',
    REDIS_POOL_MIN: 2,
    REDIS_POOL_MAX: 8,
  };

  it('should parse standard redis:// url correctly', () => {
    const config = getRedisConfig(baseMockEnv as EnvConfig);
    expect(config.host).toBe('redis-server');
    expect(config.port).toBe(7000);
    expect(config.password).toBe('mypassword');
    expect(config.enableTLS).toBe(false);
    expect(config.flushDbOnStart).toBe(false);
  });

  it('should flag enableTLS as true for rediss:// secure connections', () => {
    const secureEnv = {
      ...baseMockEnv,
      REDIS_URL: 'rediss://:upstashkey@managed.upstash.io:6379',
    };
    const config = getRedisConfig(secureEnv as EnvConfig);
    expect(config.host).toBe('managed.upstash.io');
    expect(config.password).toBe('upstashkey');
    expect(config.enableTLS).toBe(true);
  });

  it('should throw error for invalid connection string format', () => {
    const emptyUrlEnv = {
      ...baseMockEnv,
      REDIS_URL: 'mysql://localhost:3306/db',
    };
    expect(() => getRedisConfig(emptyUrlEnv as EnvConfig)).toThrow(/Invalid REDIS_URL format/);
  });

  it('should enable flushDbOnStart for test executions', () => {
    const testEnv = {
      ...baseMockEnv,
      NODE_ENV: 'test',
    };
    const config = getRedisConfig(testEnv as EnvConfig);
    expect(config.flushDbOnStart).toBe(true);
  });

  it('should validate connection pool dimensions', () => {
    const badPool = {
      ...baseMockEnv,
      REDIS_POOL_MIN: 5,
      REDIS_POOL_MAX: 2,
    };
    expect(() => getRedisConfig(badPool as EnvConfig)).toThrow(/Invalid Redis pool/);
  });

  it('should freeze the returned config object', () => {
    const config = getRedisConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
