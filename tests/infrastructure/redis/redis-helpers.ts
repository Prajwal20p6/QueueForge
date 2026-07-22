import Redis from 'ioredis';
import { getTestConfig } from '../../helpers/test-config';

/**
 * Connection helper creating Redis client for testing.
 */
export class RedisHelper {
  public static createTestRedis(): Redis {
    const config = getTestConfig();
    return new Redis({
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
  }
}
