import { Queue, QueueEvents } from 'bullmq';
import { Logger } from 'winston';
import { QueueConfig } from '../../config/queue.config';
import { RedisModule } from '../redis/redis.module';
import { Repositories } from '../repositories';
import { ObservabilityContext } from '../../observability/types';
import { QueueClient } from './queue-client';
import { QueueFactory } from './queue-factory';
import { QueueManager } from './queue-manager';

export interface QueueModule {
  client: QueueClient;
  manager: QueueManager;
  queues: {
    main: Queue;
    delayed: Queue;
    dlq: Queue;
  };
}

/**
 * Initializes BullMQ client wrappers, queue factories, managers, and event monitors.
 */
export async function initializeQueueModule(
  config: QueueConfig,
  redisModule: RedisModule,
  repositories: Repositories,
  logger: Logger,
  observability: ObservabilityContext
): Promise<QueueModule> {
  logger.info('[QueueModule] Initializing Queue Module...');

  const client = new QueueClient(redisModule.client, config, logger);

  // Pre-create the standard queues using QueueFactory
  const main = QueueFactory.createMainQueue(client, config);
  const delayed = QueueFactory.createDelayedQueue(client, config);
  const dlq = QueueFactory.createDLQQueue(client, config);

  const manager = new QueueManager(client, repositories, logger, observability);

  // Setup basic events loggers
  try {
    const mainEvents = new QueueEvents(config.mainQueueName || 'queueforge-main', {
      connection: redisModule.client,
    });

    mainEvents.on('active', ({ jobId }) => {
      logger.info(`[QueueModule] Job "${jobId}" started processing.`);
    });

    mainEvents.on('progress', ({ jobId, data }) => {
      logger.info(`[QueueModule] Job "${jobId}" progress update: ${data}%`);
    });

    mainEvents.on('completed', ({ jobId }) => {
      logger.info(`[QueueModule] Job "${jobId}" successfully completed.`);
    });

    mainEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[QueueModule] Job "${jobId}" failed. Reason: ${failedReason}`);
    });

    mainEvents.on('stalled', ({ jobId }) => {
      logger.warn(`[QueueModule] Job "${jobId}" has stalled and may be retried.`);
    });
  } catch (err: any) {
    logger.warn(`[QueueModule] Failed to bind event listeners: ${err.message}`);
  }

  logger.info('[QueueModule] Queue Module initialized successfully.');

  return {
    client,
    manager,
    queues: {
      main,
      delayed,
      dlq,
    },
  };
}
