import Redis from 'ioredis';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { InfrastructureError } from '../shared/errors/infrastructure-error';
import { ErrorCode } from '../shared/constants/error-codes';

/**
 * Initializes, pings, configures, and tests read/write capabilities on a Redis client.
 *
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @returns Connected and validated Redis client instance.
 */
export async function setupRedis(config: Config, logger: Logger): Promise<Redis> {
  logger.info('[RedisSetup] Initializing Redis client connection...');

  const redisHost = config.redis?.host || 'localhost';
  const redisPort = config.redis?.port || 6379;
  const redisPassword = config.redis?.password;
  const redisDb = config.redis?.db || 0;

  const redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDb,
    maxRetriesPerRequest: null, // Critical requirement for BullMQ
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  try {
    // 1. Verify connection using PING
    const pong = await redis.ping();
    logger.info(`[RedisSetup] Connection successful: PING -> ${pong}`);

    // 2. Try configuring persistence settings (AOF + RDB) safely
    try {
      await redis.config('SET', 'appendonly', 'yes');
      await redis.config('SET', 'save', '900 1 300 10 60 10000');
      logger.info('[RedisSetup] Persistence parameters (AOF + RDB) configured successfully.');
    } catch (cfgErr: any) {
      logger.warn(
        `[RedisSetup] Non-critical persistence configuration update bypassed: ${cfgErr.message}`
      );
    }

    // 3. Verify read/write operations capability
    const testKey = 'queueforge:startup:rw:test';
    await redis.setex(testKey, 10, 'passed');
    const val = await redis.get(testKey);
    await redis.del(testKey);

    if (val !== 'passed') {
      throw new Error('Read/Write verification check mismatch');
    }

    logger.info('[RedisSetup] Read/Write verification checks completed successfully.');
    return redis;
  } catch (err: any) {
    logger.error('[RedisSetup] Redis configuration diagnostics failed!', err);
    throw new InfrastructureError(
      `Redis client startup failed: ${err.message}`,
      ErrorCode.DB_CONNECTION_FAILED,
      { originalError: err }
    );
  }
}
export { Redis };
