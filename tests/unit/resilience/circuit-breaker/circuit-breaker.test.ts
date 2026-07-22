import { CircuitBreaker } from '../../../../src/resilience/circuit-breaker/circuit-breaker';
import { CircuitState } from '../../../../src/resilience/circuit-breaker/circuit-breaker-state';
import { CircuitOpenError } from '../../../../src/resilience/errors/circuit-open-error';

describe('CircuitBreaker Unit Tests', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('dest-1', {
      threshold: 3,
      timeout: 100, // 100ms for fast testing
      successThreshold: 2,
    });
  });

  it('should start in CLOSED state and execute operations successfully', async () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    const res = await breaker.execute(async () => 'OK');
    expect(res).toBe('OK');
    expect(breaker.getMetrics().totalCalls).toBe(1);
    expect(breaker.getMetrics().successfulCalls).toBe(1);
  });

  it('should transition CLOSED -> OPEN when failure threshold is reached', async () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    const failCall = async () => {
      try {
        await breaker.execute(async () => {
          throw new Error('Downstream failure');
        });
      } catch {
        // ignore
      }
    };

    await failCall();
    await failCall();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);

    await failCall(); // 3rd failure trips circuit
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Subsequent calls while OPEN should throw CircuitOpenError immediately
    await expect(breaker.execute(async () => 'OK')).rejects.toThrow(CircuitOpenError);
  });

  it('should transition OPEN -> HALF_OPEN after timeout and HALF_OPEN -> CLOSED after consecutive successes', async () => {
    // Trip circuit to OPEN
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Wait for timeout to elapse
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    // First success in HALF_OPEN
    await breaker.execute(async () => 'success-1');
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    // Second success in HALF_OPEN closes the circuit
    await breaker.execute(async () => 'success-2');
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should trip HALF_OPEN -> OPEN immediately on any failure', async () => {
    // Trip to OPEN
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

    // Single failure in HALF_OPEN trips back to OPEN
    try {
      await breaker.execute(async () => {
        throw new Error('Half open failure');
      });
    } catch {
      // ignore
    }

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should support manual reset to CLOSED state', () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    breaker.reset();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    expect(breaker.getMetrics().totalCalls).toBe(0);
  });
});
