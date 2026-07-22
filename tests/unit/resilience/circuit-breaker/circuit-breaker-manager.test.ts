import { CircuitBreakerManager } from '../../../../src/resilience/circuit-breaker/circuit-breaker-manager';
import { CircuitState } from '../../../../src/resilience/circuit-breaker/circuit-breaker-state';

describe('CircuitBreakerManager Unit Tests', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager({ threshold: 2, timeout: 60000 });
  });

  it('should lazily create and cache CircuitBreakers per destinationId', () => {
    const cb1 = manager.getBreaker('webhook-dest-1');
    const cb2 = manager.getBreaker('webhook-dest-1');
    expect(cb1).toBe(cb2);
    expect(cb1.destinationId).toBe('webhook-dest-1');
  });

  it('should query health status across registered breakers', () => {
    const cb1 = manager.getBreaker('dest-1');
    const cb2 = manager.getBreaker('dest-2');

    cb2.recordFailure();
    cb2.recordFailure(); // Trip dest-2 to OPEN

    const statusMap = manager.getHealthStatus();
    expect(statusMap.get('dest-1')).toBe(CircuitState.CLOSED);
    expect(statusMap.get('dest-2')).toBe(CircuitState.OPEN);
    expect(cb1).toBeDefined();
  });

  it('should support resetting individual breakers', () => {
    const cb = manager.getBreaker('dest-1');
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.OPEN);

    manager.resetBreaker('dest-1');
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });
});
