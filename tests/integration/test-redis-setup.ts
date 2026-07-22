import Redis from 'ioredis';

let _redis: Redis | null = null;

/**
 * Initializes an ioredis client connected to the test Redis instance.
 * Uses REDIS_URL from the environment or falls back to localhost:6379.
 *
 * @returns Connected ioredis client ready for test use.
 *
 * @example
 * ```typescript
 * const redis = await setupTestRedis();
 * await redis.set('key', 'value');
 * await cleanupTestRedis();
 * ```
 */
export async function setupTestRedis(): Promise<Redis> {
  if (_redis) return _redis;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  _redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    lazyConnect: true,
    enableReadyCheck: true,
  });

  await _redis.connect();

  // Verify connectivity
  const pong = await _redis.ping();
  if (pong !== 'PONG') {
    throw new Error(`[setupTestRedis] Redis PING failed. Got: "${pong}"`);
  }

  // Flush test database to ensure clean slate
  await _redis.flushdb();

  console.log(`[setupTestRedis] Connected to Redis at ${redisUrl}.`);
  return _redis;
}

/**
 * Flushes and disconnects the shared test Redis client.
 */
export async function cleanupTestRedis(): Promise<void> {
  if (_redis) {
    try {
      await _redis.flushdb();
      await _redis.quit();
    } catch {
      _redis.disconnect();
    } finally {
      _redis = null;
      console.log('[cleanupTestRedis] Test Redis connection closed.');
    }
  }
}

/**
 * Returns the active test Redis client without re-initializing.
 * @throws {Error} if setupTestRedis() has not been called.
 */
export function getTestRedis(): Redis {
  if (!_redis) {
    throw new Error('[getTestRedis] setupTestRedis() must be called before accessing the client.');
  }
  return _redis;
}
