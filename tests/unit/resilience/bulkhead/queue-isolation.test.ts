import { configureQueueIsolation } from '../../../../src/resilience/bulkhead/queue-isolation';


describe('QueueIsolation Unit Tests', () => {
  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 60,
    circuitBreakerVolumeThreshold: 20,
    bulkheadEnabled: true,
    bulkheadPoolSizeWebhook: 10,
    bulkheadPoolSizeDatabase: 5,
    bulkheadPoolSizeQueue: 8,
    backpressureEnabled: true,
    backpressureQueueDepthThreshold: 1000,
    backpressureAlarmThreshold: 80,
    backpressureSheddingStrategy: 'DROP_LATEST',
    maxRetries: 5,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    backoffJitterFactor: 0.2,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  it('should compile correct maps of bulkhead pool sizes from configurations', () => {
    const mapping = configureQueueIsolation(config);

    expect(mapping.get('WEBHOOK')).toEqual({ poolSize: 10, concurrency: 10 });
    expect(mapping.get('DATABASE')).toEqual({ poolSize: 5, concurrency: 5 });
    expect(mapping.get('QUEUE')).toEqual({ poolSize: 8, concurrency: 8 });
    expect(mapping.get('AUDIT')).toBeDefined();
  });
});
