import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

let _queue: Queue | null = null;
let _queueEvents: QueueEvents | null = null;

/** Name of the isolated BullMQ queue used during integration tests. */
export const TEST_QUEUE_NAME = 'queueforge-test';

/**
 * Creates and initializes an isolated BullMQ Queue for integration tests.
 * Drains any residual jobs from previous runs before returning.
 *
 * @param redis - Initialized Redis client to use as BullMQ connection.
 * @returns Initialized BullMQ Queue ready for test use.
 *
 * @example
 * ```typescript
 * const redis = await setupTestRedis();
 * const queue = await setupTestQueue(redis);
 * await queue.add('test-job', { payload: 'data' });
 * await cleanupTestQueue();
 * ```
 */
export async function setupTestQueue(redis: Redis): Promise<Queue> {
  if (_queue) return _queue;

  _queue = new Queue(TEST_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 100 },
    },
  });

  _queueEvents = new QueueEvents(TEST_QUEUE_NAME, { connection: redis });

  // Drain residual jobs from any previous failed runs
  await _queue.obliterate({ force: true }).catch(() => {
    // Ignore if queue doesn't exist yet
  });

  console.log(`[setupTestQueue] Test queue "${TEST_QUEUE_NAME}" initialized.`);
  return _queue;
}

/**
 * Drains and closes the shared test queue.
 */
export async function cleanupTestQueue(): Promise<void> {
  if (_queue) {
    try {
      await _queue.obliterate({ force: true });
      await _queue.close();
    } catch {
      // Ignore errors on cleanup
    } finally {
      _queue = null;
    }
  }
  if (_queueEvents) {
    try {
      await _queueEvents.close();
    } catch {
      // Ignore
    } finally {
      _queueEvents = null;
    }
  }
  console.log('[cleanupTestQueue] Test queue closed.');
}

/**
 * Returns the active test Queue without re-initializing.
 * @throws {Error} if setupTestQueue() has not been called.
 */
export function getTestQueue(): Queue {
  if (!_queue) {
    throw new Error('[getTestQueue] setupTestQueue() must be called before accessing the queue.');
  }
  return _queue;
}
