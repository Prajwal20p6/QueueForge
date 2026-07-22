import client from 'prom-client';
import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../interfaces/IQueueService';
import { IdempotencyCache } from '../../infrastructure/cache/idempotency-cache';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

// Register custom metrics counters
export const syncSuccessCounter =
  (client.register.getSingleMetric('sync_state_success_total') as client.Counter) ||
  new client.Counter({
    name: 'sync_state_success_total',
    help: 'Total successful state sync operations',
  });

export const syncErrorsCounter =
  (client.register.getSingleMetric('sync_state_errors_total') as client.Counter) ||
  new client.Counter({
    name: 'sync_state_errors_total',
    help: 'Total errors encountered during state sync',
  });

export interface SyncResult {
  synced: number;
  discrepancies?: number;
  errors: number;
}

/**
 * Service auditing consistency between pending PostgreSQL delivery records and Redis BullMQ jobs.
 */
export class SyncStateService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly queue: Queue | any,
    _cache?: IdempotencyCache | any,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Identifies database records missing in Redis queues and schedules missing dispatches.
   */
  public async sync(): Promise<SyncResult> {
    this.logger?.info?.('Initiating queue synchronization check...');

    let synced = 0;
    let errors = 0;
    let discrepancies = 0;

    try {
      // 1. Fetch pending delivery records from database
      let dbPending: any[] = [];
      if (typeof this.deliveryRepository.findByStatus === 'function') {
        dbPending = await this.deliveryRepository.findByStatus('PENDING');
      } else if (typeof this.deliveryRepository.findAll === 'function') {
        const all = await this.deliveryRepository.findAll();
        dbPending = all.filter((d: any) => {
          const s = typeof d.getStatus === 'function' ? (d.getStatus().kind || d.getStatus().getValue?.()) : d.status;
          return String(s).toUpperCase() === 'PENDING';
        });
      }

      // 2. Fetch jobs from BullMQ queue
      const bullQueue = (this.queue as any)?.getQueueInstance
        ? (this.queue as any).getQueueInstance()
        : null;

      if (!bullQueue || typeof bullQueue.getJobs !== 'function') {
        this.logger?.warn?.('Redis BullMQ queue instance is not accessible in this context. Bypassing sync.');
        return { synced: 0, errors: 0, discrepancies: 0 };
      }

      const activeJobs = await bullQueue.getJobs(['waiting', 'active', 'delayed', 'paused']);
      const activeJobKeys = new Set(
        activeJobs.map((j: any) => `${j.data?.taskResultId || j.data?.deliveryId}:${j.data?.destinationId || ''}`)
      );

      // 3. Match database records to active queue jobs
      for (const delivery of dbPending) {
        const trId = delivery.getTaskResultId ? delivery.getTaskResultId() : delivery.taskResultId;
        const destId = delivery.getDestinationId ? delivery.getDestinationId() : delivery.destinationId;
        const key = `${trId}:${destId}`;

        if (!activeJobKeys.has(key)) {
          discrepancies++;
          this.logger?.warn?.(`Found missing Redis job for pending delivery "${delivery.getId?.() || delivery.id}". Re-enqueuing...`);
          try {
            if (typeof this.queue.enqueueDelivery === 'function') {
              await this.queue.enqueueDelivery(trId, destId, (delivery.getRetryCount?.() || 0) + 1);
            } else if (typeof this.queue.add === 'function') {
              await this.queue.add('deliver-task-result', { deliveryId: delivery.getId?.() || delivery.id });
            }
            synced++;
          } catch (err: any) {
            errors++;
            this.logger?.error?.(`Failed to re-enqueue missing delivery "${delivery.getId?.() || delivery.id}": ${err.message}`);
          }
        }
      }

      // 4. Remove active jobs that no longer exist in DB or are in terminal state
      for (const job of activeJobs) {
        const trId = job.data?.taskResultId;
        const destId = job.data?.destinationId;

        if (trId && destId && typeof this.deliveryRepository.findByTaskResultId === 'function') {
          try {
            const recordList = await this.deliveryRepository.findByTaskResultId(trId) || [];
            const record = recordList.find((d: any) => (d.getDestinationId ? d.getDestinationId() : d.destinationId) === destId);
            const statusKind = record
              ? (typeof record.getStatus === 'function' ? (record.getStatus().kind || record.getStatus().getValue?.()) : record.status)
              : null;

            const isTerminal = statusKind === 'completed' || statusKind === 'COMPLETED' || statusKind === 'failed_dlq' || statusKind === 'FAILED_DLQ';

            if (!record || isTerminal) {
              discrepancies++;
              await job.remove?.();
              synced++;
            }
          } catch {
            // ignore error
          }
        }
      }

      syncSuccessCounter.inc();
      this.logger?.info?.(`Queue sync check finished. Synced: ${synced}, Errors: ${errors}, Discrepancies: ${discrepancies}`);
      return { synced, errors, discrepancies };
    } catch (err: any) {
      syncErrorsCounter.inc();
      this.logger?.error?.(`State sync process failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Convenience alias method returning synced and errors count.
   */
  public async syncRedisWithDatabase(): Promise<{ synced: number; errors: number }> {
    return this.sync();
  }
}
