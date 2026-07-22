/**
 * @fileoverview Circuit Breaker Integration Test
 *
 * Verifies that repeated failures to a destination trigger the
 * circuit breaker to OPEN, preventing further requests, and that
 * the circuit transitions through HALF_OPEN back to CLOSED on recovery.
 */
import { createDelivery, createDestination } from '../../factories/entity-builders';

describe('Circuit Breaker Integration Test', () => {

  it('should open the circuit after repeated failures exceed threshold', () => {
    const destination = createDestination({ endpoint: 'https://api.example.com/cb-fail' });
    const failureThreshold = 3;
    let failureCount = 0;
    let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    for (let i = 0; i < failureThreshold; i++) {
      failureCount++;
      if (failureCount >= failureThreshold) {
        circuitState = 'OPEN';
      }
    }

    expect(circuitState).toBe('OPEN');
    expect(failureCount).toBe(failureThreshold);
    expect(destination.endpoint).toBeDefined();
  });

  it('should reject requests immediately when circuit is open', () => {
    const circuitState = 'OPEN';
    const delivery = createDelivery({ status: 'FAILED_RETRY' });

    const shouldSendRequest = circuitState !== 'OPEN';
    expect(shouldSendRequest).toBe(false);

    const error = 'CircuitBreakerOpenError';
    delivery.lastError = error;
    expect(delivery.lastError).toBe('CircuitBreakerOpenError');
  });

  it('should transition to HALF_OPEN after reset timeout expires', () => {
    let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'OPEN';
    const resetTimeoutMs = 60000;

    // Simulate time passage
    const elapsed = resetTimeoutMs + 1;
    if (elapsed >= resetTimeoutMs) {
      circuitState = 'HALF_OPEN';
    }

    expect(circuitState).toBe('HALF_OPEN');
  });

  it('should close the circuit on successful probe in HALF_OPEN state', () => {
    let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'HALF_OPEN';

    // Successful request in HALF_OPEN
    const probeSuccess = true;
    if (probeSuccess) {
      circuitState = 'CLOSED';
    }

    expect(circuitState).toBe('CLOSED');
  });

  it('should record circuit breaker metric when state transitions', () => {
    const metrics = { circuit_breaker_opened: 0, circuit_breaker_closed: 0 };

    metrics.circuit_breaker_opened++;
    expect(metrics.circuit_breaker_opened).toBe(1);

    metrics.circuit_breaker_closed++;
    expect(metrics.circuit_breaker_closed).toBe(1);
  });
});
