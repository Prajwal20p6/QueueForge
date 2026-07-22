import { CircuitBreakerStateMachine } from '../../../../src/resilience/circuit-breaker/state-machine';

describe('CircuitBreakerStateMachine Unit Tests', () => {
  let stateMachine: CircuitBreakerStateMachine;

  beforeEach(() => {
    stateMachine = new CircuitBreakerStateMachine(50, 100, 3);
  });

  it('should initially start in CLOSED state', () => {
    expect(stateMachine.getState()).toBe('CLOSED');
    expect(stateMachine.canAttempt()).toBe(true);
  });

  it('should transition to OPEN if failure rate threshold exceeded in CLOSED state', () => {
    // Volume threshold is 3, failure rate limit 50%
    stateMachine.recordSuccess();
    stateMachine.recordFailure();
    expect(stateMachine.getState()).toBe('CLOSED');

    stateMachine.recordFailure(); // total: 3 requests, 2 failures = 66.6% -> trips
    expect(stateMachine.getState()).toBe('OPEN');
    expect(stateMachine.canAttempt()).toBe(false);
  });

  it('should transition to HALF_OPEN after timeout elapsed in OPEN state', async () => {
    // Trip breaker
    stateMachine.recordFailure();
    stateMachine.recordFailure();
    stateMachine.recordFailure();
    expect(stateMachine.getState()).toBe('OPEN');

    // Wait 120ms (timeout is 100ms)
    await new Promise(resolve => setTimeout(resolve, 120));

    expect(stateMachine.getState()).toBe('HALF_OPEN');
    expect(stateMachine.canAttempt()).toBe(true);
  });

  it('should transition back to CLOSED on success in HALF_OPEN state', async () => {
    stateMachine.recordFailure();
    stateMachine.recordFailure();
    stateMachine.recordFailure();

    await new Promise(resolve => setTimeout(resolve, 120));
    expect(stateMachine.getState()).toBe('HALF_OPEN');

    stateMachine.recordSuccess();
    expect(stateMachine.getState()).toBe('CLOSED');
  });

  it('should trip back to OPEN on failure in HALF_OPEN state', async () => {
    stateMachine.recordFailure();
    stateMachine.recordFailure();
    stateMachine.recordFailure();

    await new Promise(resolve => setTimeout(resolve, 120));
    expect(stateMachine.getState()).toBe('HALF_OPEN');

    stateMachine.recordFailure();
    expect(stateMachine.getState()).toBe('OPEN');
  });
});
