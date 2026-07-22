import {
  recordCircuitBreakerTransition,
  recordCircuitBreakerEvent,
} from '../../../../src/resilience/circuit-breaker/metrics';

describe('CircuitBreakerMetrics Unit Tests', () => {
  it('should run transition recording without throwing errors', () => {
    expect(() => recordCircuitBreakerTransition('dest-1', 'CLOSED', 'OPEN')).not.toThrow();
  });

  it('should run event recording without throwing errors', () => {
    expect(() => recordCircuitBreakerEvent('dest-1', 'opened')).not.toThrow();
    expect(() => recordCircuitBreakerEvent('dest-1', 'closed')).not.toThrow();
  });
});
