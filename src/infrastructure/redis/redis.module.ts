import Redis from 'ioredis';
import { Logger } from 'winston';
import { RedisConfig } from '../../config/redis.config';
import { connectRedis, getRedisClient } from './redis-client';
import { RedisOperations } from './redis-operations';
import { KeyBuilder } from './key-builder';
import { RedisConnectionPool, RedisMonitor } from './connection-pool';

export interface RedisModule {
  client: Redis;
  operations: RedisOperations;
  keyBuilder: typeof KeyBuilder;
  connectionPool: RedisConnectionPool;
  monitor: RedisMonitor;
}

/**
 * Initializes all client connection wrappers, managers, and monitors in the Redis Module.
 * 
 * @param config - The database config options.
 * @param logger - Winston logger instance.
 */
export async function initializeRedisModule(
  config: RedisConfig,
  logger: Logger
): Promise<RedisModule> {
  logger.info('[RedisModule] Initializing Redis Module...');

  // Connect client instance
  await connectRedis(config);

  const client = getRedisClient();
  const operations = new RedisOperations(client, logger);
  const connectionPool = new RedisConnectionPool(config, logger);
  const monitor = new RedisMonitor(config, logger);

  logger.info('[RedisModule] Redis initialized successfully.');

  return {
    client,
    operations,
    keyBuilder: KeyBuilder,
    connectionPool,
    monitor,
  };
}
