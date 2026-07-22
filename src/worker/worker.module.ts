import { ConnectorFactory } from './connectors/connector-factory';
import { DeliveryStateMachine } from './state-machine/delivery-state-machine';
import { ErrorClassifier } from './error-classifier';
import { AttemptRecorder } from './attempt-recorder';
import { DeliveryExecutor } from './delivery-executor';
import { JobProcessor } from './job-processor';
import { Heartbeat } from './recovery/heartbeat';
import { GracefulShutdown } from './recovery/graceful-shutdown';
import { WorkerMonitor } from './recovery/worker-monitor';
import { WorkerMetrics } from './metrics/worker-metrics';

export interface WorkerModuleDependencies {
  repositories?: any;
  queueManager?: any;
  services?: any;
  resilience?: any;
  security?: any;
  observability?: any;
  logger?: any;
}

export interface WorkerModule {
  processor: JobProcessor;
  stateMachine: DeliveryStateMachine;
  executor: DeliveryExecutor;
  heartbeat: Heartbeat;
  shutdown: GracefulShutdown;
  monitor: WorkerMonitor;
  metrics: WorkerMetrics;
}

/**
 * Initializes and bootstraps all QueueForge worker layer engines, state machines, egress connectors, and recovery daemons.
 */
export async function initializeWorkerModule(
  config?: any,
  ...args: any[]
): Promise<any> {
  if (args.length >= 4) {
    const processor = new JobProcessor(config, ...args);
    await processor.start();
    return processor;
  }

  const dependencies: WorkerModuleDependencies = args[0] || {};
  const logger = dependencies.logger;
  const observability = dependencies.observability;
  const repositories = dependencies.repositories || {};
  const resilience = dependencies.resilience || {};

  const connectorFactory = new ConnectorFactory(logger, observability);
  const stateMachine = new DeliveryStateMachine(repositories.deliveries, undefined, logger);
  const errorClassifier = new ErrorClassifier(logger);
  const attemptRecorder = new AttemptRecorder(repositories.attempts, logger);
  const executor = new DeliveryExecutor(
    connectorFactory,
    stateMachine,
    errorClassifier,
    attemptRecorder,
    resilience,
    repositories,
    logger,
    observability
  );

  const processor = new JobProcessor(dependencies.queueManager, executor, logger, observability, config);
  const heartbeat = new Heartbeat(undefined, dependencies.queueManager?.redis, undefined, config, logger);
  const shutdown = new GracefulShutdown(processor, heartbeat, logger, config);
  const monitor = new WorkerMonitor(processor, heartbeat, logger);
  const metrics = new WorkerMetrics(undefined, logger);

  // Start background job processor and heartbeat loop
  await processor.start();
  await heartbeat.start();

  // Register OS signal listeners (SIGTERM, SIGINT)
  shutdown.registerSignalHandlers();

  logger?.info?.('Worker module initialized successfully with job processor, delivery executor, state machine, and recovery daemons.');

  return {
    processor,
    stateMachine,
    executor,
    heartbeat,
    shutdown,
    monitor,
    metrics,
  };
}

/**
 * Backward-compatible helper for full worker module initialization.
 */
export async function initializeWorker(
  config?: any,
  ...args: any[]
): Promise<any> {
  return initializeWorkerModule(config, ...args);
}
