import { TTLManager } from '../../../../src/infrastructure/cache/ttl-manager';
import { RedisOperations } from '../../../../src/infrastructure/redis/redis-operations';
import { Logger } from 'winston';

describe('ttl-manager Unit Tests', () => {
  let mockRedisOps: jest.Mocked<RedisOperations>;
  let mockRedisClient: any;
  let logger: Logger;
  let manager: TTLManager;

  beforeEach(() => {
    mockRedisClient = {
      zscore: jest.fn().mockResolvedValue('1700000000000'),
      zrem: jest.fn(),
    };
    mockRedisOps = {
      zadd: jest.fn(),
      expire: jest.fn(),
      srem: jest.fn(),
      delete: jest.fn(),
      ttl: jest.fn(),
      zrangebyscore: jest.fn(),
      client: mockRedisClient,
    } as any;
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    manager = new TTLManager(mockRedisOps, logger);
  });

  afterEach(() => {
    manager.stopBackgroundCleanup();
  });

  it('should schedule keys for tracking', async () => {
    await manager.schedule('test-key', 5000);
    expect(mockRedisOps.zadd).toHaveBeenCalledWith('queueforge:ttl_tracker', expect.any(Number), 'test-key');
    expect(mockRedisOps.expire).toHaveBeenCalledWith('test-key', 5000);
  });

  it('should extend and unschedule keys', async () => {
    mockRedisOps.ttl.mockResolvedValue(1000);

    await manager.extend('test-key', 2000);
    expect(mockRedisOps.expire).toHaveBeenCalledWith('test-key', 3000);

    await manager.unschedule('test-key');
    expect(mockRedisOps.delete).toHaveBeenCalledWith('test-key');
  });

  it('should run cleanup for expired keys', async () => {
    mockRedisOps.zrangebyscore.mockResolvedValue(['expired-key']);
    mockRedisOps.delete.mockResolvedValue(true);

    const evicted = await manager.cleanupExpired();
    expect(evicted).toBe(1);
    expect(mockRedisOps.delete).toHaveBeenCalledWith('expired-key');
    expect(mockRedisClient.zrem).toHaveBeenCalledWith('queueforge:ttl_tracker', 'expired-key');
  });
});
