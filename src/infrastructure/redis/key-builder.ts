/**
 * Consistently builds namespaced Redis keys for QueueForge.
 */
export class KeyBuilder {
  /**
   * Heartbeat key for worker health tracking.
   */
  public static heartbeat(workerId: string): string {
    return `queueforge:heartbeat:${workerId}`;
  }

  /**
   * Idempotency check cache key.
   */
  public static idempotencyCache(taskResultId: string, destinationId: string): string {
    return `queueforge:idempotency:${taskResultId}:${destinationId}`;
  }

  /**
   * Circuit breaker state key.
   */
  public static circuitBreaker(destinationId: string): string {
    return `queueforge:cb:${destinationId}`;
  }

  /**
   * Rate limiter counter key.
   */
  public static rateLimitCounter(apiKey: string, endpoint: string): string {
    return `queueforge:ratelimit:${apiKey}:${endpoint}`;
  }

  /**
   * Session state data key.
   */
  public static sessionData(sessionId: string): string {
    return `queueforge:session:${sessionId}`;
  }

  /**
   * Distributed lock key.
   */
  public static lockKey(resourceId: string): string {
    return `queueforge:lock:${resourceId}`;
  }

  /**
   * Observability metrics counter key.
   */
  public static metricsKey(metricName: string): string {
    return `queueforge:metrics:${metricName}`;
  }

  /**
   * Generic key-value cache key.
   */
  public static cacheKey(namespace: string, id: string): string {
    return `queueforge:cache:${namespace}:${id}`;
  }

  /**
   * Temporary metadata cache key.
   */
  public static tempDataKey(id: string, expirationSec: number): string {
    return `queueforge:temp:${id}:${expirationSec}`;
  }
}
