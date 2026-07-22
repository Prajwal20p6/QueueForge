import { Container } from '../container';
import { initializeResilienceModule } from '../../resilience';

/**
 * Initializer setting up Opossum circuit breaker manager, bulkheads, backpressure monitors, and retry executors.
 */
export class ResilienceInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const queueManager = this.container.get('queueManager');
    const logger = this.container.get('logger');
    const observability = this.container.get('observability');

    const resModule = await initializeResilienceModule(config, {
      queueManager,
      logger,
      observability,
    });

    this.container.register('resilience', () => resModule);
    this.container.register('circuitBreakerManager', () => resModule.circuitBreakerManager);
    this.container.register('bulkheadManager', () => resModule.bulkheadManager);
    this.container.register('backpressureMonitor', () => resModule.backpressureMonitor);
    this.container.register('retryExecutor', () => resModule.retryExecutor);
    this.container.register('timeoutManager', () => resModule.timeoutManager);
  }
}
