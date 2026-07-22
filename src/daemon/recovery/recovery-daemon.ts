import client from 'prom-client';
import { BaseDaemon } from '../base-daemon';
import { StaleJobDetector } from './stale-job-detector';
import { QueueReconstructor } from './queue-reconstructor';
import { DLQMonitor } from './dlq-monitor';

export const staleJobsRecoveredCounter =
  (client.register.getSingleMetric('queueforge_daemon_recovery_stale_jobs_recovered_total') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_daemon_recovery_stale_jobs_recovered_total',
    help: 'Total stale deliveries recovered by recovery daemon',
  });

export const queueReconstructedCounter =
  (client.register.getSingleMetric('queueforge_daemon_recovery_queue_reconstructed_total') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_daemon_recovery_queue_reconstructed_total',
    help: 'Total jobs reconstructed into active queue queues by recovery daemon',
  });

export interface RecoveryDaemonDependencies {
  detector?: StaleJobDetector;
  reconstructor?: QueueReconstructor;
  dlqMonitor?: DLQMonitor;
  logger?: any;
  observability?: any;
}

/**
 * Singleton recovery daemon detecting crashed worker tasks, repairing state gaps, and reconstructing queues.
 */
export class RecoveryDaemon extends BaseDaemon {
  private readonly detector?: StaleJobDetector;
  private readonly reconstructor?: QueueReconstructor;
  private readonly dlqMonitor?: DLQMonitor;
  private readonly delayedQueueProcessor?: any;
  private readonly stateSync?: any;
  private readonly queueReconstruction?: any;

  constructor(...args: any[]) {
    let config: any;
    let dependencies: RecoveryDaemonDependencies = {};
    let logger: any;
    let delayedQueueProcessor: any;
    let stateSync: any;
    let dlqMon: any;
    let queueRecon: any;

    if (args.length >= 4 && (args[0]?.start || args[0]?.processOverdueRetries)) {
      // Legacy signature: (delayedQueueProcessor, stateSync, dlqMonitor, queueReconstruction, logger, metrics)
      delayedQueueProcessor = args[0];
      stateSync = args[1];
      dlqMon = args[2];
      queueRecon = args[3];
      logger = args[4];
      dependencies = {
        dlqMonitor: dlqMon,
        reconstructor: queueRecon,
        logger,
      };
    } else if (args.length >= 3 && (args[0]?.repositories || args[0]?.getRepositories)) {
      // Legacy signature: (dependencies, logger, metrics, config)
      const deps = args[0];
      logger = args[1];
      config = args[3];
      const repos = typeof deps.getRepositories === 'function' ? deps.getRepositories() : (deps.repositories || {});
      const qm = typeof deps.getQueueManager === 'function' ? deps.getQueueManager() : deps.queueManager;
      dependencies = {
        detector: new StaleJobDetector(repos.deliveries, undefined, config?.daemon, logger),
        reconstructor: new QueueReconstructor(repos.deliveries, qm, logger),
        dlqMonitor: new DLQMonitor(repos.deliveries, undefined, config?.daemon, logger),
        logger,
      };
    } else {
      config = args[0];
      dependencies = args[1] || {};
      logger = dependencies.logger || config?.logger;
    }

    const intervalMs = config?.recoveryIntervalMs || config?.intervalMs || 60000;
    super('RecoveryDaemon', intervalMs, logger, dependencies.observability);

    this.detector = dependencies.detector;
    this.reconstructor = dependencies.reconstructor;
    this.dlqMonitor = dependencies.dlqMonitor;
    this.delayedQueueProcessor = delayedQueueProcessor;
    this.stateSync = stateSync;
    this.queueReconstruction = queueRecon;
  }

  public override async start(): Promise<void> {
    await super.start();
    if (this.delayedQueueProcessor?.start) await Promise.resolve(this.delayedQueueProcessor.start()).catch(() => {});
    if (this.stateSync?.start) await Promise.resolve(this.stateSync.start()).catch(() => {});
    if (this.dlqMonitor?.start) await Promise.resolve(this.dlqMonitor.start()).catch(() => {});
    if (this.queueReconstruction?.start) await Promise.resolve(this.queueReconstruction.start()).catch(() => {});
  }

  public override async stop(): Promise<void> {
    await super.stop();
    if (this.delayedQueueProcessor?.stop) await Promise.resolve(this.delayedQueueProcessor.stop()).catch(() => {});
    if (this.stateSync?.stop) await Promise.resolve(this.stateSync.stop()).catch(() => {});
    if (this.dlqMonitor?.stop) await Promise.resolve(this.dlqMonitor.stop()).catch(() => {});
    if (this.queueReconstruction?.stop) await Promise.resolve(this.queueReconstruction.stop()).catch(() => {});
  }

  /**
   * Executes a complete background recovery cycle.
   */
  public async execute(): Promise<void> {
    this.logger?.info?.('[RecoveryDaemon] Starting recovery daemon execution cycle...');

    // 1. Detect and recover stale jobs
    let recoveredCount = 0;
    if (this.detector) {
      const staleDeliveries = await this.detector.detectStale();
      for (const del of staleDeliveries) {
        try {
          const maxRetries = del.maxRetries || 3;
          const retryCount = del.retryCount || 0;

          if (retryCount < maxRetries) {
            this.logger?.info?.(`[RecoveryDaemon] Resetting stale delivery "${del.id}" to PENDING (retryCount=${retryCount}/${maxRetries})`);
            if (this.reconstructor) {
              await this.reconstructor.enqueuePending();
            }
          }
          recoveredCount++;
        } catch (err: any) {
          this.logger?.error?.(`[RecoveryDaemon] Failed to recover stale delivery "${del.id}": ${err.message}`);
        }
      }
      staleJobsRecoveredCounter.inc(recoveredCount);
    }

    // 2. Reconstruct queue idempotently
    let enqueuedCount = 0;
    if (this.reconstructor) {
      const res = await this.reconstructor.reconstruct();
      enqueuedCount = res.enqueued;
      queueReconstructedCounter.inc(enqueuedCount);
    }

    // 3. Monitor DLQ
    if (this.dlqMonitor) {
      await this.dlqMonitor.monitorDLQ();
    }

    this.logger?.info?.(`[RecoveryDaemon] Recovery cycle completed (recovered: ${recoveredCount}, enqueued: ${enqueuedCount})`);
  }
}
