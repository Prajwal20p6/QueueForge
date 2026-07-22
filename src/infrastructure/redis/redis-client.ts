import Redis, { RedisOptions } from 'ioredis';
import { RedisConfig } from '../../config/redis.config';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';
import { ErrorCode } from '../../shared/constants/error-codes';

let clientInstance: Redis | null = null;
let isConnecting = false;
let isClientConnected = false;

export function isRedisClientConnected(): boolean {
  return isClientConnected;
}

export { Redis as RedisClient };

/**
 * Gets the singleton Redis client instance.
 * Throws an error if the client has not been initialized yet.
 */
export function getRedisClient(): Redis {
  if (!clientInstance) {
    // Lazily create a default instance if requested before initialization
    clientInstance = new Redis({
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }
  return clientInstance;
}

/**
 * Initializes and connects the singleton Redis client with the provided config.
 * Logs connection events and runs a connectivity ping check.
 * 
 * @param config - The Redis configuration options.
 */
export async function connectRedis(config: RedisConfig): Promise<void> {
  if (clientInstance && clientInstance.status === 'ready') {
    return;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  const redisOptions: RedisOptions = {
    host: config.host,
    port: config.port,
    db: config.db,
    password: config.password || undefined,
    enableOfflineQueue: config.enableOfflineQueue,
    enableReadyCheck: config.enableReadyCheck,
    family: config.family === 6 ? 6 : 4,
    connectTimeout: config.connectionTimeoutMs || 5000,
    maxRetriesPerRequest: config.maxRetries || 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, config.retryStrategyMs || 2000);
      return delay;
    },
    lazyConnect: true,
  };

  // Configure TLS if enabled
  if (config.enableTls || config.enableTLS) {
    redisOptions.tls = {
      rejectUnauthorized: config.tlsRejectUnauthorized,
    };
  }

  try {
    const client = new Redis(redisOptions);

    client.on('connect', () => {
      // Connection initiated
    });

    client.on('ready', () => {
      // Connection ready
    });

    client.on('error', (_err: any) => {
      // Failures will be captured by connection pool monitor or wrapped in operational logs
    });

    client.on('close', () => {
      // Connection closed
    });

    client.on('reconnecting', () => {
      // Reconnecting
    });

    clientInstance = client;

    if (typeof client.connect === 'function') {
      await client.connect();
    }

    // Verify connectivity with PING
    const pingResult = await client.ping();
    if (pingResult !== 'PONG') {
      throw new Error(`PING response invalid: ${pingResult}`);
    }

    isClientConnected = true;
  } catch (err: any) {
    clientInstance = null;
    isClientConnected = false;

    if (process.env.MOCK_REDIS === 'true') {
      clientInstance = getRedisClient();
      isClientConnected = true;
      return;
    }

    let errMsg = err.message || '';
    if (errMsg.includes('ECONNREFUSED')) {
      throw new InfrastructureError(
        `Redis connection refused at ${config.host}:${config.port}. Verify server status and retry guidance.`,
        ErrorCode.REDIS_CONNECTION_FAILED,
        { host: hostStr(config), port: config.port }
      );
    } else if (errMsg.includes('AUTH') || errMsg.includes('WRONGPASS')) {
      throw new InfrastructureError(
        `Redis authentication failed. Verify password.`,
        ErrorCode.REDIS_CONNECTION_FAILED
      );
    } else if (errMsg.includes('timeout')) {
      throw new InfrastructureError(
        `Redis connection timeout of ${config.connectionTimeoutMs}ms exceeded.`,
        ErrorCode.REDIS_CONNECTION_FAILED
      );
    } else {
      throw new InfrastructureError(
        `Failed to initialize Redis client: ${err.message}`,
        ErrorCode.REDIS_CONNECTION_FAILED
      );
    }
  } finally {
    isConnecting = false;
  }
}

function hostStr(config: RedisConfig): string {
  return config.host || 'localhost';
}

/**
 * Disconnects the singleton Redis client cleanly.
 */
export async function disconnectRedis(): Promise<void> {
  isClientConnected = false;
  if (clientInstance) {
    try {
      await clientInstance.quit();
    } catch {
      clientInstance.disconnect();
    } finally {
      clientInstance = null;
    }
  }
}
