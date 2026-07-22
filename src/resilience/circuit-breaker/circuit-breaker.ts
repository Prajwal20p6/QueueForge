import { CircuitState, CircuitBreakerState } from './circuit-breaker-state';
import { CircuitBreakerConfig, createDefaultConfig } from './circuit-breaker-config';
import { CircuitBreakerMetrics } from './circuit-breaker-metrics';
import { CircuitOpenError } from '../errors/circuit-open-error';

/**
 * State machine protecting downstream destinations against cascading failures using the Circuit Breaker pattern.
 */
export class CircuitBreaker {
  public readonly destinationId: string;
  public readonly name: string;
  public readonly config: CircuitBreakerConfig;
  public readonly metrics: CircuitBreakerMetrics;
  private stateInstance: CircuitBreakerState;

  constructor(
    destinationId: string,
    config?: Partial<CircuitBreakerConfig>,
    private readonly logger?: any,
    private readonly observability?: any
  ) {
    this.destinationId = destinationId;
    this.name = `breaker:${destinationId}`;
    this.config = createDefaultConfig(config);
    this.metrics = new CircuitBreakerMetrics(logger);
    this.stateInstance = new CircuitBreakerState(CircuitState.CLOSED);
  }

  public getState(): CircuitState {
    this.checkStateTransition();
    return this.stateInstance.getState();
  }

  public getBreakerState(): CircuitBreakerState {
    this.checkStateTransition();
    return this.stateInstance;
  }

  public canExecute(): boolean {
    const currentState = this.getState();
    return currentState === CircuitState.CLOSED || currentState === CircuitState.HALF_OPEN;
  }

  /**
   * Evaluates auto-transitions based on timeouts (OPEN -> HALF_OPEN).
   */
  private checkStateTransition(): void {
    if (this.stateInstance.getState() === CircuitState.OPEN) {
      if (this.stateInstance.canAttemptReset(this.config.timeout)) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.stateInstance.getState();
    if (previousState === newState) return;

    const openedAt = newState === CircuitState.OPEN ? new Date() : null;
    this.stateInstance = new CircuitBreakerState(newState, openedAt, 0, 0);
    this.metrics.recordStateTransition(previousState, newState);

    this.logger?.warn?.(
      `[CircuitBreaker:${this.destinationId}] State transition: ${previousState} -> ${newState}`
    );
  }

  /**
   * Executes protected asynchronous operation within the circuit breaker envelope.
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.metrics.recordCall();

    if (!this.canExecute()) {
      this.metrics.recordRejection();
      this.logger?.warn?.(`[CircuitBreaker:${this.destinationId}] Execution rejected - Circuit is OPEN`);
      throw new CircuitOpenError(this.destinationId);
    }

    const tracer = this.observability?.tracer;
    const span = tracer?.startSpan?.(`circuit_breaker.${this.destinationId}`);

    try {
      const result = await fn();
      this.recordSuccess();
      span?.setStatus?.({ code: 1 }); // OK
      return result;
    } catch (err: any) {
      span?.recordException?.(err);
      span?.setStatus?.({ code: 2, message: err.message }); // ERROR
      this.recordFailure(err);
      throw err;
    } finally {
      span?.end?.();
    }
  }

  public recordSuccess(): void {
    this.metrics.recordSuccess();
    const currentState = this.getState();

    if (currentState === CircuitState.HALF_OPEN) {
      const newSuccessCount = this.stateInstance.getSuccessCount() + 1;
      if (newSuccessCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      } else {
        this.stateInstance = new CircuitBreakerState(
          CircuitState.HALF_OPEN,
          this.stateInstance.getOpenedAt(),
          0,
          newSuccessCount
        );
      }
    } else if (currentState === CircuitState.CLOSED) {
      if (this.stateInstance.getFailureCount() > 0) {
        this.stateInstance = new CircuitBreakerState(CircuitState.CLOSED, null, 0, 0);
      }
    }
  }

  public recordFailure(_error?: Error): void {
    this.metrics.recordFailure();
    const currentState = this.getState();

    if (currentState === CircuitState.CLOSED) {
      const newFailureCount = this.stateInstance.getFailureCount() + 1;
      if (newFailureCount >= this.config.threshold) {
        this.transitionTo(CircuitState.OPEN);
      } else {
        this.stateInstance = new CircuitBreakerState(
          CircuitState.CLOSED,
          null,
          newFailureCount,
          0
        );
      }
    } else if (currentState === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  public emit(event: string, err?: any): void {
    if (event === 'success') {
      this.recordSuccess();
    } else if (event === 'failure') {
      this.recordFailure(err);
    }
  }

  public reset(): void {
    const previousState = this.stateInstance.getState();
    this.stateInstance = new CircuitBreakerState(CircuitState.CLOSED);
    this.metrics.reset();
    if (previousState !== CircuitState.CLOSED) {
      this.metrics.recordStateTransition(previousState, CircuitState.CLOSED);
    }
    this.logger?.info?.(`[CircuitBreaker:${this.destinationId}] Manually reset to CLOSED`);
  }

  public getMetrics(): any {
    return this.metrics.getMetrics();
  }
}
