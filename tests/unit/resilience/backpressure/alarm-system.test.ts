import { AlarmSystem } from '../../../../src/resilience/backpressure/alarm-system';

import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';

describe('AlarmSystem Unit Tests', () => {
  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 60,
    circuitBreakerVolumeThreshold: 20,
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
    backoffJitterFactor: 0.2,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  let mockLogger: jest.Mocked<AuditLogger>;
  let system: AlarmSystem;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    system = new AlarmSystem(config, mockLogger, {});
  });

  it('should categorize AlarmLevels correctly according to occupancy thresholds', () => {
    expect(system.checkThreshold(50, 100)).toBe('GREEN'); // 50%
    expect(system.checkThreshold(75, 100)).toBe('YELLOW'); // 75%
    expect(system.checkThreshold(95, 100)).toBe('RED'); // 95%
    expect(system.checkThreshold(99.5, 100)).toBe('CRITICAL'); // 99.5%
  });

  it('should store and retrieve alarm trigger history', async () => {
    system.recordAlarm('YELLOW', 75);
    system.recordAlarm('RED', 95);

    const history = await system.getAlarmHistory();
    expect(history).toHaveLength(2);
    expect(history[0].level).toBe('RED');
    expect(history[1].level).toBe('YELLOW');
  });
});
