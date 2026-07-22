import { CircuitBreaker } from './circuit-breaker';
import { CircuitState } from './circuit-breaker-state';
import { CircuitBreakerConfig } from './circuit-breaker-config';

/**
 * Manager component dynamically creating, caching, and querying per-destination CircuitBreaker instances.
 */
export class CircuitBreakerManager {
  private readonly breakers: Map<string, CircuitBreaker> = new Map();
  private readonly redis?: any;
  private readonly defaultConfig?: any;
  private readonly logger?: any;
  private readonly observability?: any;

  constructor(
    arg1?: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) {
    if (arg1 && typeof arg1 === 'object' && ('call' in arg1 || 'get' in arg1 || 'set' in arg1 || 'del' in arg1)) {
      this.redis = arg1;
      this.defaultConfig = arg2;
      this.logger = arg3;
      this.observability = arg4;
    } else {
      this.defaultConfig = arg1;
      this.logger = arg2;
      this.observability = arg3;
    }
  }

  public getBreaker(destinationId: string): CircuitBreaker {
    let breaker = this.breakers.get(destinationId);
    if (!breaker) {
      breaker = this.createBreaker(destinationId);
    }
    return breaker;
  }

  public getCircuitBreaker(destinationId: string): CircuitBreaker {
    return this.getBreaker(destinationId);
  }

  public getOrCreateBreaker(destinationId: string, destinationConfig?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(destinationId);
    if (!breaker) {
      breaker = this.createBreaker(destinationId, destinationConfig);
    }
    return breaker;
  }

  public getState(destinationId: string): CircuitState {
    return this.getBreaker(destinationId).getState();
  }

  public async reset(destinationId: string): Promise<void> {
    this.resetBreaker(destinationId);
    if (this.redis && typeof this.redis.del === 'function') {
      try {
        await this.redis.del(`cb:state:${destinationId}`);
      } catch (err: any) {
        this.logger?.error?.(`Failed to delete Redis key for breaker ${destinationId}: ${err.message}`);
      }
    }
  }

  public isOpen(destinationId: string): boolean {
    const breaker = this.getBreaker(destinationId);
    return breaker.getState() === CircuitState.OPEN;
  }

  public createBreaker(
    destinationId: string,
    destinationConfig?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const cbConfig = {
      ...(this.defaultConfig?.circuitBreaker || this.defaultConfig || {}),
      ...destinationConfig,
    };
    const breaker = new CircuitBreaker(destinationId, cbConfig, this.logger, this.observability);
    this.breakers.set(destinationId, breaker);
    this.logger?.debug?.(`[CircuitBreakerManager] Created CircuitBreaker for destination "${destinationId}"`);
    return breaker;
  }

  public resetBreaker(destinationId: string): void {
    const breaker = this.breakers.get(destinationId);
    if (breaker) {
      breaker.reset();
    }
  }

  public getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  public getHealthStatus(): Map<string, CircuitState> {
    const statusMap = new Map<string, CircuitState>();
    for (const [id, breaker] of this.breakers.entries()) {
      statusMap.set(id, breaker.getState());
    }
    return statusMap;
  }

  public isDestinationAvailable(destinationId: string): boolean {
    const breaker = this.getBreaker(destinationId);
    return breaker.canExecute();
  }
}
