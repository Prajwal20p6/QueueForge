import { Container } from '../container';
import { initializeWorkerModule } from '../../worker';

/**
 * Initializer launching BullMQ worker pool, job processor loops, and destination connectors.
 */
export class WorkerInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const application = this.container.get('application');
    const resilience = this.container.get('resilience');
    const logger = this.container.get('logger');
    const observability = this.container.get('observability');

    const workerModule = await initializeWorkerModule(
      config,
      { application, resilience },
      logger,
      observability
    );

    this.container.register('worker', () => workerModule);
    this.container.register('jobProcessor', () => workerModule.jobProcessor);
    this.container.register('deliveryExecutor', () => workerModule.deliveryExecutor);
  }
}
