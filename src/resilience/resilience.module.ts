import { CircuitBreakerManager } from './circuit-breaker/circuit-breaker-manager';
import { BulkheadManager } from './bulkhead/bulkhead-manager';
import { QueueMonitor } from './backpressure/queue-monitor';
import { BackpressureMonitor } from './backpressure/backpressure-monitor';
import { AdaptiveLimiter } from './backpressure/adaptive-limiter';
import { RetryExecutor } from './retry/retry-executor';
import { TimeoutManager } from './timeout/timeout-manager';

export interface ResilienceModuleDependencies {
  queueManager?: any;
  queue?: any;
  logger?: any;
  observability?: any;
}

export interface ResilienceModule {
  circuitBreakerManager: CircuitBreakerManager;
  bulkheadManager: BulkheadManager;
  queueMonitor: QueueMonitor;
  backpressureMonitor: BackpressureMonitor;
  adaptiveLimiter: AdaptiveLimiter;
  retryExecutor: RetryExecutor;
  timeoutManager: TimeoutManager;
}

/**
 * Initializes and bootstraps all QueueForge resilience layer managers and monitoring tools.
 */
export async function initializeResilienceModule(
  config?: any,
  dependencies: ResilienceModuleDependencies = {}
): Promise<ResilienceModule> {
  const logger = dependencies.logger;
  const observability = dependencies.observability;
  const queue = dependencies.queueManager || dependencies.queue;

  const circuitBreakerManager = new CircuitBreakerManager(config, logger, observability);
  const bulkheadManager = new BulkheadManager(config, logger, observability);
  const queueMonitor = new QueueMonitor(queue, config, logger);
  const backpressureMonitor = new BackpressureMonitor(queueMonitor, undefined, config, logger);
  const adaptiveLimiter = new AdaptiveLimiter(queueMonitor, config, logger);
  const retryExecutor = new RetryExecutor(undefined, logger, observability);
  const timeoutManager = new TimeoutManager(config, logger);

  logger?.info?.('Resilience layer initialized successfully with CircuitBreaker, Bulkhead, Backpressure, Retry, and Timeout managers.');

  return {
    circuitBreakerManager,
    bulkheadManager,
    queueMonitor,
    backpressureMonitor,
    adaptiveLimiter,
    retryExecutor,
    timeoutManager,
  };
}
