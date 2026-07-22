import Redis from 'ioredis';
import { CircuitBreakerManager } from '../../../../src/resilience/circuit-breaker';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';

describe('CircuitBreakerManager Unit Tests', () => {
  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 1, // 1 second
    circuitBreakerVolumeThreshold: 3,
    bulkheadEnabled: true,
    bulkheadPoolSizeWebhook: 5,
    bulkheadPoolSizeDatabase: 5,
    bulkheadPoolSizeQueue: 5,
    backpressureEnabled: true,
    backpressureQueueDepthThreshold: 100,
    backpressureAlarmThreshold: 80,
    backpressureSheddingStrategy: 'DROP_LATEST',
    maxRetries: 5,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    backoffJitterFactor: 0.1,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    manager = new CircuitBreakerManager(mockRedis, config, mockLogger, {});
  });

  it('should create and return opossum breaker instance on first access', () => {
    const breaker = manager.getOrCreateBreaker('dest-1');
    expect(breaker).toBeDefined();
    expect(breaker.name).toBe('breaker:dest-1');
  });

  it('should fall back to local state if Redis query fails', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis Timeout'));
    const state = await manager.getState('dest-1');
    expect(state).toBe('CLOSED');
  });

  it('should clear Redis keys upon manual reset execution', async () => {
    await manager.reset('dest-1');
    expect(mockRedis.del).toHaveBeenCalledWith('cb:state:dest-1');
  });
});
