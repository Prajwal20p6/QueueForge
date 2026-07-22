import { initializeResilienceModule } from '../../../src/resilience/resilience.module';
import { CircuitState } from '../../../src/resilience/circuit-breaker/circuit-breaker-state';

describe('Resilience Combined Integration Tests', () => {
  it('should initialize complete resilience module and execute protected flow', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const module = await initializeResilienceModule(
      {
        circuitBreaker: { threshold: 2, timeout: 60000 },
        bulkhead: { maxConcurrent: 5 },
      },
      { logger }
    );

    expect(module.circuitBreakerManager).toBeDefined();
    expect(module.bulkheadManager).toBeDefined();
    expect(module.retryExecutor).toBeDefined();

    // 1. Bulkhead execution
    const bulkhead = module.bulkheadManager.getBulkhead('WEBHOOK');
    const bulkheadRes = await bulkhead.execute(async () => 'BULKHEAD_OK');
    expect(bulkheadRes).toBe('BULKHEAD_OK');

    // 2. Circuit breaker execution
    const breaker = module.circuitBreakerManager.getBreaker('dest-integration-1');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    const cbRes = await breaker.execute(async () => 'CB_OK');
    expect(cbRes).toBe('CB_OK');

    // 3. Retry execution
    const retryRes = await module.retryExecutor.execute(async () => 'RETRY_OK');
    expect(retryRes).toBe('RETRY_OK');
  });
});
