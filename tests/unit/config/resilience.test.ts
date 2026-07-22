import { getResilienceConfig } from '../../../src/config/resilience';
import { EnvConfig } from '../../../src/config/env';

describe('Config: resilience.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    MAX_RETRIES: 5,
    BACKOFF_BASE_MS: 2000,
    CIRCUIT_BREAKER_THRESHOLD: 40,
    CIRCUIT_BREAKER_TIMEOUT_MS: 8000,
    WORKER_CONCURRENCY: 10,
    DB_POOL_MAX: 10,
    REDIS_POOL_MAX: 15,
  };

  it('should parse and assemble resilience configurations', () => {
    const config = getResilienceConfig(baseMockEnv as EnvConfig);
    expect(config.circuitBreakerThreshold).toBe(40);
    expect(config.circuitBreakerTimeout).toBe(8); // 8000ms converted to seconds
    expect(config.circuitBreakerVolumeThreshold).toBe(3);

    // Webhook bulkhead should match Worker concurrency (10)
    expect(config.bulkheadPoolSizeWebhook).toBe(10);
    expect(config.bulkheadPoolSizeDatabase).toBe(10);
    expect(config.bulkheadPoolSizeQueue).toBe(15);
  });

  it('should restrict bulkhead pool sizes to small counts in test environment', () => {
    const testEnv = { ...baseMockEnv, NODE_ENV: 'test' };
    const config = getResilienceConfig(testEnv as EnvConfig);
    expect(config.bulkheadPoolSizeWebhook).toBe(2);
    expect(config.bulkheadPoolSizeDatabase).toBe(2);
    expect(config.bulkheadPoolSizeQueue).toBe(2);
  });

  it('should fail validation on invalid circuit breaker thresholds', () => {
    const badThreshold = { ...baseMockEnv, CIRCUIT_BREAKER_THRESHOLD: 120 };
    expect(() => getResilienceConfig(badThreshold as EnvConfig)).toThrow(
      /CIRCUIT_BREAKER_THRESHOLD must be/
    );
  });

  it('should freeze the returned config object and its HTTP status code arrays', () => {
    const config = getResilienceConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.retryableStatusCodes)).toBe(true);
  });
});
