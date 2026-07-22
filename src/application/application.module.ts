import { IngestResultService } from './services/ingest-result.service';
import { ValidateResultService } from './services/validate-result.service';
import { ProcessDeliveryService } from './services/process-delivery.service';
import { HandleFailureService } from './services/handle-failure.service';
import { ScheduleRetryService } from './services/schedule-retry.service';
import { RegisterDestinationService } from './services/register-destination.service';
import { FindDestinationsService } from './services/find-destinations.service';
import { RecoverStaleJobsService } from './services/recover-stale-jobs.service';
import { SyncStateService } from './services/sync-state.service';
import { RebuildQueueService } from './services/rebuild-queue.service';

/**
 * Application Module container providing access to all wired application services.
 */
export interface ApplicationModule {
  ingestResultService: IngestResultService;
  validateResultService: ValidateResultService;
  processDeliveryService: ProcessDeliveryService;
  handleFailureService: HandleFailureService;
  scheduleRetryService: ScheduleRetryService;
  scheduleRetry: ScheduleRetryService;
  registerDestinationService: RegisterDestinationService;
  findDestinationsService: FindDestinationsService;
  recoverStaleJobsService: RecoverStaleJobsService;
  syncStateService: SyncStateService;
  rebuildQueueService: RebuildQueueService;
}

export type ServiceContainer = ApplicationModule;

/**
 * Dependencies required to initialize the Application Module container.
 */
export interface ApplicationDependencies {
  resultRepository?: any;
  deliveryRepository?: any;
  destinationRepository?: any;
  attemptRepository?: any;
  queueManager?: any;
  queue?: any;
  redisOps?: any;
  eventPublisher?: any;
  logger?: any;
  observability?: any;
  metrics?: any;
  tracer?: any;
  cache?: any;
  httpClient?: any;
}

/**
 * Synchronously or asynchronously initializes and wires all application services with provided dependencies.
 */
export function initializeApplicationModule(
  dependencies: ApplicationDependencies
): ApplicationModule {
  const logger = dependencies.logger;
  const metrics = dependencies.observability || dependencies.metrics;
  const queue = dependencies.queueManager || dependencies.queue;

  const validateResultService = new ValidateResultService(logger);

  const ingestResultService = new IngestResultService(
    dependencies.resultRepository,
    dependencies.deliveryRepository,
    dependencies.destinationRepository,
    queue,
    dependencies.cache,
    logger
  );

  const processDeliveryService = new ProcessDeliveryService(
    dependencies.deliveryRepository,
    dependencies.destinationRepository,
    dependencies.attemptRepository,
    logger,
    metrics,
    dependencies.tracer,
    dependencies.resultRepository,
    dependencies.httpClient
  );

  const handleFailureService = new HandleFailureService(
    dependencies.deliveryRepository,
    logger,
    metrics,
    dependencies.eventPublisher,
    dependencies.attemptRepository
  );

  const scheduleRetryService = new ScheduleRetryService(
    dependencies.deliveryRepository,
    queue,
    logger
  );

  const registerDestinationService = new RegisterDestinationService(
    dependencies.destinationRepository,
    logger
  );

  const findDestinationsService = new FindDestinationsService(
    dependencies.destinationRepository,
    logger
  );

  const recoverStaleJobsService = new RecoverStaleJobsService(
    dependencies.deliveryRepository,
    queue,
    logger
  );

  const syncStateService = new SyncStateService(
    dependencies.deliveryRepository,
    queue,
    dependencies.cache,
    logger
  );

  const rebuildQueueService = new RebuildQueueService(
    dependencies.deliveryRepository,
    queue,
    logger
  );

  return {
    ingestResultService,
    validateResultService,
    processDeliveryService,
    handleFailureService,
    scheduleRetryService,
    scheduleRetry: scheduleRetryService,
    registerDestinationService,
    findDestinationsService,
    recoverStaleJobsService,
    syncStateService,
    rebuildQueueService,
  };
}

export const createServiceContainer = initializeApplicationModule;
