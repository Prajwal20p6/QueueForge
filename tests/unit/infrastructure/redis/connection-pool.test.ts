import { RedisConnectionPool, RedisMonitor, ConnectionStatus } from '../../../../src/infrastructure/redis/connection-pool';
import { getRedisClient } from '../../../../src/infrastructure/redis/redis-client';
import { RedisConfig } from '../../../../src/config/redis.config';
import { Logger } from 'winston';

jest.mock('ioredis');
jest.mock('../../../../src/infrastructure/redis/redis-client');

describe('connection-pool Unit Tests', () => {
  let mockRedis: any;
  let logger: Logger;
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
    mockRedis = {
      status: 'ready',
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      info: jest.fn().mockResolvedValue('# Clients\r\nconnected_clients:3\r\n# Memory\r\nused_memory_human:1.50M\r\nused_memory_peak_human:2.0M\r\nmem_fragmentation_ratio:1.2\r\n# Replication\r\nrole:master\r\nconnected_slaves:2\r\n'),
      dbsize: jest.fn().mockResolvedValue(42),
      keys: jest.fn().mockResolvedValue(['k1', 'k2']),
      offlineQueue: [],
    };
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
  });

  describe('RedisConnectionPool', () => {
    it('should retrieve status stats and evaluate health', () => {
      const pool = new RedisConnectionPool(config, logger);
      expect(pool.isHealthy()).toBe(true);

      const stats = pool.getStats();
      expect(stats.connected).toBe(true);
      expect(stats.reconnecting).toBe(false);
      expect(stats.queued).toBe(0);

      expect(pool.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should reconnect and drain correctly', async () => {
      const pool = new RedisConnectionPool(config, logger);
      await pool.reconnect();
      expect(mockRedis.connect).toHaveBeenCalled();

      await pool.drain();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('RedisMonitor', () => {
    it('should retrieve monitor metrics', async () => {
      const monitor = new RedisMonitor(config, logger);

      const mem = await monitor.getMemoryUsage();
      expect(mem.usedMemory).toBe('1.50M');
      expect(mem.peakMemory).toBe('2.0M');
      expect(mem.fragmentationRatio).toBe(1.2);

      const count = await monitor.getKeyCount();
      expect(count).toBe(42);

      const keys = await monitor.getKeyStats('test*');
      expect(keys.totalKeys).toBe(2);

      const repl = await monitor.getReplicationStatus();
      expect(repl.role).toBe('master');
      expect(repl.connectedSlaves).toBe(2);
    });
  });
});
