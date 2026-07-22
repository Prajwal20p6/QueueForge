import { getConfig } from '../../config';
import { connectRedis, disconnectRedis, getRedisClient, RedisClient, isRedisClientConnected } from './redis-client';

export { getRedisClient, disconnectRedis, RedisClient };

/**
 * Initializes Redis using the global config properties.
 */
export async function initializeRedis(): Promise<RedisClient> {
  const config = getConfig();
  await connectRedis(config.redis);
  return getRedisClient();
}

/**
 * Retrieves whether the Redis connection is active.
 */
export async function getConnectionStatus(): Promise<{ isConnected: boolean }> {
  try {
    const client = getRedisClient();
    const isConnected = client.status === 'ready' && isRedisClientConnected();
    return { isConnected };
  } catch {
    return { isConnected: false };
  }
}

/**
 * Retreives active statistics from the Redis client info command.
 */
export async function getStats(): Promise<{ connectedClients: number; usedMemory: string; ops: number }> {
  const client = getRedisClient();
  let connectedClients = 0;
  let usedMemory = '0';
  let ops = 0;

  try {
    const infoStr = await client.info();
    const clientsMatch = infoStr.match(/connected_clients:(\d+)/);
    if (clientsMatch) {
      connectedClients = parseInt(clientsMatch[1], 10);
    }

    const memoryMatch = infoStr.match(/used_memory_human:([^\r\n]+)/);
    if (memoryMatch) {
      usedMemory = memoryMatch[1];
    }

    const opsMatch = infoStr.match(/instantaneous_ops_per_sec:(\d+)/);
    if (opsMatch) {
      ops = parseInt(opsMatch[1], 10);
    }
  } catch {
    // Suppress error
  }

  return { connectedClients, usedMemory, ops };
}
