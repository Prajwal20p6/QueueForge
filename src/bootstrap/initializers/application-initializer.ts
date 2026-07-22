import { Container } from '../container';
import { initializeApplicationModule } from '../../application';

/**
 * Initializer instantiating application use cases, delivery handlers, and recovery services.
 */
export class ApplicationInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const repositories: any = this.container.get('repositories');
    const queueManager: any = this.container.get('queueManager');
    const logger: any = this.container.get('logger');
    const observability: any = this.container.get('observability');

    const appServices = initializeApplicationModule({
      resultRepository: repositories?.results || repositories?.resultRepository || repositories,
      deliveryRepository: repositories?.deliveries || repositories?.deliveryRepository || repositories,
      destinationRepository: repositories?.destinations || repositories?.destinationRepository || repositories,
      attemptRepository: repositories?.attempts || repositories?.attemptRepository || repositories,
      queueManager,
      logger,
      observability,
    });

    this.container.register('application', () => appServices);
    this.container.register('ingestResultService', () => appServices.ingestResultService);
    this.container.register('validateResultService', () => appServices.validateResultService);
    this.container.register('processDeliveryService', () => appServices.processDeliveryService);
    this.container.register('handleFailureService', () => appServices.handleFailureService);
    this.container.register('scheduleRetryService', () => appServices.scheduleRetryService);
    this.container.register('registerDestinationService', () => appServices.registerDestinationService);
    this.container.register('findDestinationsService', () => appServices.findDestinationsService);
    this.container.register('recoverStaleJobsService', () => appServices.recoverStaleJobsService);
    this.container.register('syncStateService', () => appServices.syncStateService);
    this.container.register('rebuildQueueService', () => appServices.rebuildQueueService);
  }
}
