import { loadRedisConfig } from '../../../src/config/redis.config';

describe('Config: redis.config.ts', () => {
  it('should successfully build RedisConfig', () => {
    const config = loadRedisConfig();
    expect(config.url).toBe(process.env.REDIS_URL);
    expect(config.port).toBe(6379);
  });
});
