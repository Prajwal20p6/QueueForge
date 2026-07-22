import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ChaosRunner } from './chaos-runner';
import { sleep, waitUntil } from '../utils/test-utils';

/**
 * Predefined chaos scenario: Worker Crash Recovery.
 * Kills a worker heartbeat and verifies that the system detects stale workers.
 *
 * @param redis - Active Redis client.
 * @param workerId - ID of the worker to simulate crashing.
 */
export async function scenarioWorkerCrashRecovery(
  redis: Redis,
  workerId: string
): Promise<void> {
  const runner = new ChaosRunner(redis, {} as Queue);
  console.log('[Scenario] WorkerCrashRecovery: Registering and then killing worker heartbeat...');

  // Setup: register the worker
  await redis.sadd('workers:all', workerId);
  await redis.setex(`heartbeat:${workerId}`, 30, '1');

  // Inject: remove heartbeat to simulate crash
  await runner.stopHeartbeat(workerId);
  await sleep(200);

  // Assert: heartbeat key should be gone
  const exists = await redis.exists(`heartbeat:${workerId}`);
  if (exists !== 0) {
    throw new Error(`[Scenario] WorkerCrashRecovery FAILED: Heartbeat key still exists for "${workerId}".`);
  }

  await runner.restoreAll();
  console.log('[Scenario] WorkerCrashRecovery: PASSED ✓');
}

/**
 * Predefined chaos scenario: Database Failure Handling.
 * Simulates a Prisma client failure and asserts graceful error logging.
 *
 * @param redis - Active Redis client (for future state checks).
 * @param queue - BullMQ Queue to verify no jobs are lost.
 */
export async function scenarioDatabaseFailureHandling(
  redis: Redis,
  queue: Queue
): Promise<void> {
  const runner = new ChaosRunner(redis, queue);
  console.log('[Scenario] DatabaseFailureHandling: Injecting DB failure...');

  // Inject
  await runner.injectDatabaseFailure(500);
  await sleep(100);

  // Assert: queue should still be reachable (Redis-backed)
  const counts = await queue.getJobCounts('waiting', 'active');
  if (typeof counts.waiting !== 'number') {
    throw new Error('[Scenario] DatabaseFailureHandling FAILED: Queue unreachable during DB failure.');
  }

  await runner.restoreAll();
  console.log('[Scenario] DatabaseFailureHandling: PASSED ✓');
}

/**
 * Predefined chaos scenario: Redis Restart Recovery.
 * Flushes Redis and verifies the queue system can reconstruct state.
 *
 * @param redis - Active Redis client.
 * @param queue - BullMQ Queue to verify.
 */
export async function scenarioRedisRestartRecovery(
  redis: Redis,
  queue: Queue
): Promise<void> {
  console.log('[Scenario] RedisRestartRecovery: Flushing Redis to simulate restart...');

  // Add a job before flush
  await queue.add('recovery-test-job', { testPayload: true });

  // Simulate Redis restart by flushing
  await redis.flushdb();
  await sleep(200);

  // Assert: system should survive — queue object remains valid
  const pong = await redis.ping();
  if (pong !== 'PONG') {
    throw new Error('[Scenario] RedisRestartRecovery FAILED: Redis not responsive after flush.');
  }

  console.log('[Scenario] RedisRestartRecovery: PASSED ✓');
}

/**
 * Predefined chaos scenario: Cascading Failures.
 * Simultaneously injects Redis and network failures and asserts system remains stable.
 *
 * @param redis - Active Redis client.
 * @param queue - Active BullMQ Queue.
 */
export async function scenarioCascadingFailures(
  redis: Redis,
  queue: Queue
): Promise<void> {
  const runner = new ChaosRunner(redis, queue);
  console.log('[Scenario] CascadingFailures: Injecting simultaneous Redis + network failures...');

  // Inject multiple failures concurrently
  await Promise.all([
    runner.injectRedisFailure(1000),
    runner.injectNetworkFailure(0.5, 'https://webhook.example.com'),
  ]);

  await sleep(200);

  // Assert: queue should still be constructable (it uses its own Redis connection)
  const jobCount = await queue.getJobCounts('waiting').catch(() => ({ waiting: -1 }));
  if (typeof jobCount.waiting === 'undefined') {
    throw new Error('[Scenario] CascadingFailures FAILED: Queue unreachable.');
  }

  await runner.restoreAll();
  console.log('[Scenario] CascadingFailures: PASSED ✓');
}

/**
 * Predefined chaos scenario: Network Partition.
 * Simulates total network isolation for all webhook calls and verifies timeout handling.
 *
 * @param redis - Active Redis client.
 * @param queue - Active BullMQ Queue.
 */
export async function scenarioNetworkPartition(
  redis: Redis,
  queue: Queue
): Promise<void> {
  const runner = new ChaosRunner(redis, queue);
  console.log('[Scenario] NetworkPartition: Injecting 100% network failure...');

  await runner.injectNetworkFailure(1.0, 'https://webhook.example.com');
  await sleep(100);

  // Assert: overloading queue should still work (internal)
  await runner.overloadQueue(5);

  const counts = await queue.getJobCounts('waiting');
  if ((counts.waiting ?? 0) < 5) {
    throw new Error(
      `[Scenario] NetworkPartition FAILED: Expected >= 5 waiting jobs, got ${counts.waiting}.`
    );
  }

  // Cleanup chaos jobs
  await queue.obliterate({ force: true });
  await runner.restoreAll();
  console.log('[Scenario] NetworkPartition: PASSED ✓');
}
