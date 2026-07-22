import { CircuitState } from './circuit-breaker-state';

export interface CircuitBreakerMetricsData {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rejectedCalls: number;
  stateTransitions: number;
  closedTransitions: number;
  openTransitions: number;
  halfOpenTransitions: number;
  lastTransitionTimestamp: string | null;
}

/**
 * Metric collector recording total calls, successes, failures, rejections, and state transitions for CircuitBreaker.
 */
export class CircuitBreakerMetrics {
  private totalCalls = 0;
  private successfulCalls = 0;
  private failedCalls = 0;
  private rejectedCalls = 0;
  private stateTransitions = 0;
  private closedTransitions = 0;
  private openTransitions = 0;
  private halfOpenTransitions = 0;
  private lastTransitionTimestamp: string | null = null;

  constructor(private readonly logger?: any) {}

  public recordCall(): void {
    this.totalCalls++;
  }

  public recordSuccess(): void {
    this.successfulCalls++;
  }

  public recordFailure(): void {
    this.failedCalls++;
  }

  public recordRejection(): void {
    this.rejectedCalls++;
  }

  public recordStateTransition(from: CircuitState, to: CircuitState): void {
    this.stateTransitions++;
    this.lastTransitionTimestamp = new Date().toISOString();

    if (to === CircuitState.CLOSED) this.closedTransitions++;
    else if (to === CircuitState.OPEN) this.openTransitions++;
    else if (to === CircuitState.HALF_OPEN) this.halfOpenTransitions++;

    this.logger?.info?.(`[CircuitBreakerMetrics] Circuit state transitioned from ${from} -> ${to}`);
  }

  public getMetrics(): CircuitBreakerMetricsData {
    return {
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      rejectedCalls: this.rejectedCalls,
      stateTransitions: this.stateTransitions,
      closedTransitions: this.closedTransitions,
      openTransitions: this.openTransitions,
      halfOpenTransitions: this.halfOpenTransitions,
      lastTransitionTimestamp: this.lastTransitionTimestamp,
    };
  }

  public reset(): void {
    this.totalCalls = 0;
    this.successfulCalls = 0;
    this.failedCalls = 0;
    this.rejectedCalls = 0;
    this.stateTransitions = 0;
    this.closedTransitions = 0;
    this.openTransitions = 0;
    this.halfOpenTransitions = 0;
    this.lastTransitionTimestamp = null;
  }
}
