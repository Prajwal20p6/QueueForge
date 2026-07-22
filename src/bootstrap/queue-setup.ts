import Redis from 'ioredis';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { QueueManager } from '../infrastructure/queue/bullmq-client';

/**
 * Initializes and validates the BullMQ queue management context.
 *
 * @param redis - Connected Redis client instance.
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @returns Initialized QueueManager instance.
 */
export async function setupQueue(
  redis: Redis,
  config: Config,
  logger: Logger
): Promise<QueueManager> {
  logger.info('[QueueSetup] Instantiating BullMQ QueueManager...');

  const queueManager = new QueueManager(redis, config.queue);

  // 1. Explicitly trigger queues creation and verify connection
  await queueManager.initializeQueues();
  logger.info('[QueueSetup] Main, Delayed, and DLQ queues generated.');

  // 2. Validate accessibility by checking job counts
  try {
    const mainQueue = queueManager.getMainQueue();
    const delayedQueue = queueManager.getDelayedQueue();
    const dlq = queueManager.getDLQ();

    await Promise.all([
      mainQueue.getJobCounts(),
      delayedQueue.getJobCounts(),
      dlq.getJobCounts(),
    ]);

    logger.info('[QueueSetup] Queues connection connectivity validated.');

    // 3. Purge queues in test environment to guarantee test isolation
    const env = config.app?.environment || 'development';
    if (env === 'test') {
      logger.warn('[QueueSetup] Test environment detected! Draining all active queues...');
      await Promise.all([
        mainQueue.drain(true),
        delayedQueue.drain(true),
        dlq.drain(true),
      ]);
      logger.info('[QueueSetup] All queues drained successfully.');
    }
  } catch (err: any) {
    logger.error('[QueueSetup] Failed to verify BullMQ queue access', err);
    throw err;
  }

  return queueManager;
}
