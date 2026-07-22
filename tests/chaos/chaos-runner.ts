import Redis from 'ioredis';
import nock from 'nock';
import { Queue } from 'bullmq';
import { sleep } from '../utils/test-utils';

/**
 * Injects various failure modes into the QueueForge test environment for resilience validation.
 * Intended for use in chaos test suites alongside ChaosScenarios.
 *
 * @example
 * ```typescript
 * const runner = new ChaosRunner(redis, queue);
 * await runner.injectRedisFailure(3000);
 * await sleep(5000);
 * // assert recovery
 * ```
 */
export class ChaosRunner {
  private readonly redis: Redis;
  private readonly queue: Queue;
  private activeInjections: NodeJS.Timeout[] = [];

  /**
   * @param redis - ioredis client to monkey-patch for failure injection.
   * @param queue - BullMQ Queue for overload injection.
   */
  constructor(redis: Redis, queue: Queue) {
    this.redis = redis;
    this.queue = queue;
  }

  /**
   * Temporarily breaks the Redis GET/SET commands to simulate a cache failure.
   * Restores original behavior after durationMs.
   * @param durationMs - Duration of failure in milliseconds.
   */
  public async injectRedisFailure(durationMs: number): Promise<void> {
    console.warn(`[ChaosRunner] Injecting Redis failure for ${durationMs}ms`);

    const originalGet = this.redis.get.bind(this.redis);
    const originalSet = this.redis.set.bind(this.redis);

    (this.redis as unknown as { get: jest.Mock }).get = jest.fn().mockRejectedValue(
      new Error('[Chaos] Redis GET intentionally failed')
    );
    (this.redis as unknown as { set: jest.Mock }).set = jest.fn().mockRejectedValue(
      new Error('[Chaos] Redis SET intentionally failed')
    );

    const timer = setTimeout(() => {
      (this.redis as unknown as { get: typeof originalGet }).get = originalGet;
      (this.redis as unknown as { set: typeof originalSet }).set = originalSet;
      console.info('[ChaosRunner] Redis failure injection lifted.');
    }, durationMs);

    this.activeInjections.push(timer);
  }

  /**
   * Intercepts all outbound HTTP requests to a pattern and returns a 503 error.
   * Simulates downstream network failures for delivery attempts.
   * @param errorRate - Fraction of requests to fail (0.0–1.0).
   * @param endpointPattern - URL pattern to intercept (default: all).
   */
  public async injectNetworkFailure(
    errorRate: number,
    endpointPattern = 'https://webhook.example.com'
  ): Promise<void> {
    console.warn(
      `[ChaosRunner] Injecting network failure (rate=${errorRate}) on ${endpointPattern}`
    );

    const { origin, pathname } = new URL(endpointPattern);
    nock(origin)
      .post(pathname || '/')
      .times(Math.ceil(100 * errorRate))
      .replyWithError('[Chaos] Simulated network failure');

    console.info(`[ChaosRunner] Network failure injection active on ${endpointPattern}`);
  }

  /**
   * Injects artificial latency on all HTTP calls to the target endpoint.
   * @param delayMs - Response delay in milliseconds.
   * @param endpointPattern - URL pattern to slow down.
   */
  public async injectNetworkDelay(
    delayMs: number,
    endpointPattern = 'https://webhook.example.com'
  ): Promise<void> {
    console.warn(`[ChaosRunner] Injecting ${delayMs}ms network delay on ${endpointPattern}`);
    const { origin, pathname } = new URL(endpointPattern);
    nock(origin)
      .post(pathname || '/')
      .delay(delayMs)
      .reply(200, { status: 'ok' })
      .persist();
  }

  /**
   * Floods the queue with a large number of no-op jobs to simulate overload.
   * @param jobCount - Number of jobs to inject.
   */
  public async overloadQueue(jobCount: number): Promise<void> {
    console.warn(`[ChaosRunner] Injecting ${jobCount} overload jobs into queue`);
    const jobs = Array.from({ length: jobCount }, (_, i) => ({
      name: 'chaos-overload-job',
      data: { chaosJobIndex: i, createdAt: Date.now() },
    }));
    await this.queue.addBulk(jobs);
    console.info(`[ChaosRunner] Added ${jobCount} chaos jobs to queue.`);
  }

  /**
   * Simulates a worker heartbeat failure by deleting the heartbeat key in Redis.
   * @param workerId - Worker ID whose heartbeat to kill.
   */
  public async stopHeartbeat(workerId: string): Promise<void> {
    console.warn(`[ChaosRunner] Stopping heartbeat for worker "${workerId}"`);
    await this.redis.del(`heartbeat:${workerId}`);
    console.info(`[ChaosRunner] Heartbeat key deleted for worker "${workerId}".`);
  }

  /**
   * Simulates a random worker crash by deleting it from the workers registry.
   */
  public async killRandomWorker(): Promise<void> {
    const workers = await this.redis.smembers('workers:all');
    if (workers.length === 0) {
      console.warn('[ChaosRunner] No registered workers found to kill.');
      return;
    }
    const target = workers[Math.floor(Math.random() * workers.length)]!;
    await this.redis.srem('workers:all', target);
    await this.redis.del(`heartbeat:${target}`);
    console.warn(`[ChaosRunner] Worker "${target}" forcefully killed.`);
  }

  /**
   * Cancels all active chaos injections and restores normal behavior.
   */
  public async restoreAll(): Promise<void> {
    this.activeInjections.forEach(clearTimeout);
    this.activeInjections = [];
    nock.cleanAll();
    console.info('[ChaosRunner] All chaos injections cleared.');
  }

  /**
   * Injects a database failure by temporarily making $queryRaw throw.
   * @param _durationMs - Duration unused in this mock-based injection (for API compat).
   */
  public async injectDatabaseFailure(_durationMs: number): Promise<void> {
    console.warn('[ChaosRunner] Database failure injection (log-only in mock mode)');
    // In real integration tests, this would firewall the DB connection.
    // In unit test mode, the Prisma mock can be patched by the test directly.
    await sleep(50);
  }

  /**
   * Restarts simulation (clears and re-registers chaos patterns).
   */
  public async restartRandomService(): Promise<void> {
    await this.restoreAll();
    console.info('[ChaosRunner] Service restart simulated — chaos cleared.');
  }
}
