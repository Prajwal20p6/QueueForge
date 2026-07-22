import Redis from 'ioredis';
import { connectRedis, getRedisClient, disconnectRedis } from '../../../../src/infrastructure/redis/redis-client';
import { RedisConfig } from '../../../../src/config/redis.config';
import { InfrastructureError } from '../../../../src/shared/errors/infrastructure-error';

const mockRedisInstance = {
  status: 'wait',
  connect: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisInstance);
});

describe('redis-client Unit Tests', () => {
  const config: RedisConfig = {
    url: 'redis://localhost:6379',
    host: 'localhost',
    port: 6379,
    db: 0,
    maxRetries: 3,
    retryStrategyMs: 1000,
    connectionTimeoutMs: 5000,
    enableOfflineQueue: false,
    enableReadyCheck: true,
    family: 4,
    keyPrefix: '',
    enableTls: false,
    tlsRejectUnauthorized: false,
    poolMin: 1,
    poolMax: 10,
    enableTLS: false,
    connectionTimeout: 5000,
    idleTimeout: 30000,
    maxRetriesOnConnectionFailure: 3,
    retryDelayMs: 1000,
    enablePersistence: false,
    persistenceMode: 'RDB',
    flushDbOnStart: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisInstance.status = 'wait';
    mockRedisInstance.ping.mockResolvedValue('PONG');
    mockRedisInstance.connect.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await disconnectRedis();
  });

  it('should lazy load client instance if connect is not called', () => {
    const client = getRedisClient();
    expect(client).toBeDefined();
    expect(Redis).toHaveBeenCalled();
  });

  it('should initialize and connect successfully', async () => {
    mockRedisInstance.status = 'ready';
    await connectRedis(config);
    const client = getRedisClient();
    expect(client).toBe(mockRedisInstance);
    expect(mockRedisInstance.connect).toHaveBeenCalled();
    expect(mockRedisInstance.ping).toHaveBeenCalled();
  });

  it('should handle and wrap authentication errors', async () => {
    mockRedisInstance.ping.mockRejectedValue(new Error('WRONGPASS invalid password'));
    await expect(connectRedis(config)).rejects.toThrow(InfrastructureError);
  });

  it('should handle and wrap refused connection errors', async () => {
    mockRedisInstance.ping.mockRejectedValue(new Error('ECONNREFUSED connection refused'));
    await expect(connectRedis(config)).rejects.toThrow(InfrastructureError);
  });
});
