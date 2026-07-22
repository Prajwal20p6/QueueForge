/**
 * Enum defining standard operational states for the circuit breaker pattern.
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Immutable value object representing a snapshot of circuit breaker state, transition times, and counters.
 */
export class CircuitBreakerState {
  public readonly state: CircuitState;
  public readonly openedAt: Date | null;
  public readonly failureCount: number;
  public readonly successCount: number;

  constructor(
    state: CircuitState = CircuitState.CLOSED,
    openedAt?: Date | null,
    failureCount: number = 0,
    successCount: number = 0
  ) {
    this.state = state;
    this.openedAt = openedAt || null;
    this.failureCount = Math.max(0, failureCount);
    this.successCount = Math.max(0, successCount);
    Object.freeze(this);
  }

  public getState(): CircuitState {
    return this.state;
  }

  public getFailureCount(): number {
    return this.failureCount;
  }

  public getSuccessCount(): number {
    return this.successCount;
  }

  public getOpenedAt(): Date | null {
    return this.openedAt;
  }

  /**
   * Checks if an OPEN circuit breaker has exceeded its reset timeout and can transition to HALF_OPEN.
   */
  public canAttemptReset(timeoutMs: number = 60000): boolean {
    if (this.state === CircuitState.HALF_OPEN) {
      return true;
    }
    if (this.state !== CircuitState.OPEN || !this.openedAt) {
      return false;
    }
    const elapsed = Date.now() - this.openedAt.getTime();
    return elapsed >= timeoutMs;
  }

  public toString(): string {
    return `CircuitBreakerState[state=${this.state}, failures=${this.failureCount}, successes=${this.successCount}, openedAt=${this.openedAt ? this.openedAt.toISOString() : 'none'}]`;
  }
}
