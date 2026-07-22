import { getSheddingPolicy } from '../../../../src/resilience/backpressure/shedding-strategy';


describe('SheddingStrategy Unit Tests', () => {
  it('should map configured shedding strategies to standard policies correctly', () => {
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

    const policy = getSheddingPolicy(config);
    expect(policy.strategy).toBe('DELAY'); // DROP_LATEST maps to DELAY
  });
});
