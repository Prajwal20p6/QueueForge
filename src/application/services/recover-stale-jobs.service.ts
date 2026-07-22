import client from 'prom-client';
import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../interfaces/IQueueService';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

// Register custom metrics counters
export const heartbeatFailuresCounter =
  (client.register.getSingleMetric('worker_heartbeat_failures_total') as client.Counter) ||
  new client.Counter({
    name: 'worker_heartbeat_failures_total',
    help: 'Total worker heartbeat failures',
  });

export const jobsRecoveredCounter =
  (client.register.getSingleMetric('jobs_recovered_total') as client.Counter) ||
  new client.Counter({
    name: 'jobs_recovered_total',
    help: 'Total stale delivery jobs recovered',
  });

export interface RecoveryResult {
  recovered: number;
  failed: number;
}

/**
 * Service identifying processing deliveries that have stalled due to worker crashes.
 */
export class RecoverStaleJobsService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly queue: Queue | any,
    private readonly logger?: Logger | any,
    _metrics?: any,
    _observability?: any
  ) {}

  /**
   * Resets and re-enqueues deliveries remaining in PROCESSING state for longer than timeoutMs.
   */
  public async recoverStale(timeoutMs = 30000): Promise<RecoveryResult> {
    this.logger?.info?.('Starting stale jobs recovery scan...');

    const staleThreshold = new Date(Date.now() - timeoutMs);
    let staleDeliveries: any[] = [];
    if (typeof this.deliveryRepository.findStale === 'function') {
      staleDeliveries = await this.deliveryRepository.findStale(staleThreshold);
    } else if (typeof this.deliveryRepository.findAll === 'function') {
      const all = await this.deliveryRepository.findAll();
      staleDeliveries = all.filter((d: any) => {
        const isProc = typeof d.getStatus === 'function' ? d.getStatus().kind === 'processing' : d.status === 'PROCESSING';
        const lastUpd = d.getUpdatedAt?.() || d.updatedAt || new Date(0);
        return isProc && lastUpd < staleThreshold;
      });
    }

    if (staleDeliveries.length === 0) {
      this.logger?.debug?.('No stale processing deliveries identified.');
      return { recovered: 0, failed: 0 };
    }

    this.logger?.warn?.(`Identified ${staleDeliveries.length} stale deliveries. Initiating recovery...`);

    let recovered = 0;
    let failed = 0;

    for (const delivery of staleDeliveries) {
      try {
        heartbeatFailuresCounter.inc();

        const err = new Error('Worker crash / processing timeout detected');
        if (typeof delivery.markFailed === 'function') {
          delivery.markFailed(err, true);
        }

        const retryCount = delivery.getRetryCount ? delivery.getRetryCount() : (delivery.retryCount || 0);
        const maxRetries = 5;

        if (retryCount <= maxRetries) {
          const delayMs = Math.pow(2, Math.max(0, retryCount - 1)) * 1000;

          if (typeof delivery.scheduleRetry === 'function') {
            delivery.scheduleRetry(delayMs);
          }

          if (this.queue) {
            if (typeof this.queue.enqueueDelivery === 'function') {
              await this.queue.enqueueDelivery(
                delivery.getTaskResultId(),
                delivery.getDestinationId(),
                retryCount,
                delayMs
              );
            } else if (typeof this.queue.add === 'function') {
              await this.queue.add('deliver-task-result', { deliveryId: delivery.getId() }, { delay: delayMs });
            }
          }
          recovered++;
        } else {
          if (typeof delivery.moveToDeadLetterQueue === 'function') {
            delivery.moveToDeadLetterQueue(err.message);
          } else if (typeof delivery.moveToDLQ === 'function') {
            delivery.moveToDLQ(err.message);
          }
          failed++;
        }

        await this.deliveryRepository.save(delivery);

        if (typeof delivery.addDomainEvent === 'function') {
          delivery.addDomainEvent({
            name: 'WorkerCrashedEvent',
            aggregateId: delivery.getId(),
            timestamp: new Date(),
            workerId: 'unknown-crashed-worker',
            crashReason: 'Stale processing state detected on heartbeat manager',
          });
        }

        jobsRecoveredCounter.inc();
      } catch (err: any) {
        this.logger?.error?.(`Failed to recover stale delivery "${delivery.getId?.() || delivery.id}": ${err.message}`);
        failed++;
      }
    }

    this.logger?.info?.(`Stale jobs recovery completed. Recovered: ${recovered}, Failed: ${failed}`);
    return { recovered, failed };
  }

  /**
   * Convenience alias method returning total count of recovered jobs.
   */
  public async recoverStaleJobs(): Promise<number> {
    const res = await this.recoverStale(30000);
    return res.recovered;
  }
}
