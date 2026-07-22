import { CircuitState } from './circuit-breaker-state';

export type CircuitBreakerState = CircuitState;

/**
 * State machine managing transitioning logs and thresholds computations for a circuit breaker.
 */
export class CircuitBreakerStateMachine {
  private currentState: CircuitState = CircuitState.CLOSED;
  private lastStateChange: Date = new Date();
  private failureCount = 0;
  private successCount = 0;

  constructor(
    private readonly threshold: number,
    private readonly timeoutMs: number,
    private readonly volumeThreshold: number
  ) {}

  public getState(): CircuitState {
    // If OPEN, evaluate if recovery window elapsed to transition to HALF_OPEN
    if (this.currentState === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastStateChange.getTime();
      if (elapsed >= this.timeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
    return this.currentState;
  }

  public recordSuccess(): void {
    const state = this.getState();
    if (state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.transitionTo(CircuitState.CLOSED);
    } else if (state === CircuitState.CLOSED) {
      this.successCount++;
    }
  }

  public recordFailure(): void {
    const state = this.getState();
    this.failureCount++;

    if (state === CircuitState.CLOSED) {
      const total = this.successCount + this.failureCount;
      if (total >= this.volumeThreshold) {
        const failureRate = (this.failureCount / total) * 100;
        if (failureRate >= this.threshold) {
          this.transitionTo(CircuitState.OPEN);
        }
      }
    } else if (state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  public canAttempt(): boolean {
    const state = this.getState();
    return state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN;
  }

  private transitionTo(nextState: CircuitState): void {
    this.currentState = nextState;
    this.lastStateChange = new Date();
    this.failureCount = 0;
    this.successCount = 0;
  }
}
