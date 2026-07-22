import { loadResilienceConfig } from '../../../src/config/resilience.config';
import { EnvLoader } from '../../../src/config/env';

describe('Config: resilience.config.ts', () => {
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should successfully build ResilienceConfig', () => {
    // Force env loading first
    EnvLoader.load();

    // Clear env overrides that could pollute defaults
    delete process.env.MAX_RETRIES;
    delete process.env.BACKOFF_BASE_MS;
    delete process.env.CIRCUIT_BREAKER_THRESHOLD;
    delete process.env.CIRCUIT_BREAKER_TIMEOUT_MS;
    delete process.env.BACKPRESSURE_QUEUE_DEPTH_THRESHOLD;

    process.env.NODE_ENV = 'development';
    const config = loadResilienceConfig();
    expect(config.circuitBreaker.enabled).toBe(true);
    expect(config.bulkhead.maxConcurrent).toBe(100);
    expect(config.backpressure.shedPercentage).toBe(10);
    expect(config.retry.maxAttempts).toBe(5);
  });
});
