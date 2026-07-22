import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../interfaces/IQueueService';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

export interface RebuildResult {
  main: number;
  delayed: number;
  dlq: number;
}

/**
 * Service reconstructing active BullMQ jobs from PostgreSQL delivery records.
 */
export class RebuildQueueService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly queue: Queue | any,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Clears active BullMQ queues and reconstructs jobs from PENDING, SCHEDULED_RETRY, and FAILED_DLQ records.
   */
  public async rebuild(): Promise<RebuildResult> {
    this.logger?.warn?.('Rebuilding delivery queues from database records...');

    let main = 0;
    let delayed = 0;
    let dlq = 0;

    try {
      // 1. Clear current queue jobs if possible
      const bullQueue = (this.queue as any)?.getQueueInstance
        ? (this.queue as any).getQueueInstance()
        : (this.queue?.clean ? this.queue : null);

      if (bullQueue && typeof bullQueue.clean === 'function') {
        this.logger?.warn?.('Clearing active and waiting BullMQ queue jobs for reconstruction');
        try {
          await bullQueue.clean(0, 1000, 'wait');
          await bullQueue.clean(0, 1000, 'active');
          await bullQueue.clean(0, 1000, 'delayed');
        } catch (e: any) {
          this.logger?.debug?.(`Queue clean operation skipped: ${e.message}`);
        }
      }

      // Helper function to query deliveries by status or filter
      const findByStatus = async (status: string): Promise<any[]> => {
        if (typeof this.deliveryRepository.findByStatus === 'function') {
          return await this.deliveryRepository.findByStatus(status);
        }
        if (typeof this.deliveryRepository.findAll === 'function') {
          const all = await this.deliveryRepository.findAll();
          return all.filter((d: any) => {
            const s = typeof d.getStatus === 'function' ? (d.getStatus().kind || d.getStatus().getValue?.()) : d.status;
            return String(s).toUpperCase() === status.toUpperCase();
          });
        }
        return [];
      };

      // 2. Query PENDING records from PostgreSQL
      const pendingDeliveries = await findByStatus('PENDING');
      for (const d of pendingDeliveries) {
        const trId = d.getTaskResultId ? d.getTaskResultId() : d.taskResultId;
        const destId = d.getDestinationId ? d.getDestinationId() : d.destinationId;
        const retryCount = d.getRetryCount ? d.getRetryCount() : (d.retryCount || 0);

        if (this.queue) {
          if (typeof this.queue.enqueueDelivery === 'function') {
            await this.queue.enqueueDelivery(trId, destId, retryCount + 1);
          } else if (typeof this.queue.add === 'function') {
            await this.queue.add('deliver-task-result', { deliveryId: d.getId?.() || d.id });
          }
        }
        main++;
      }

      // 3. Query SCHEDULED_RETRY records from PostgreSQL
      const retryingDeliveries = await findByStatus('SCHEDULED_RETRY');
      for (const d of retryingDeliveries) {
        const trId = d.getTaskResultId ? d.getTaskResultId() : d.taskResultId;
        const destId = d.getDestinationId ? d.getDestinationId() : d.destinationId;
        const retryCount = d.getRetryCount ? d.getRetryCount() : (d.retryCount || 0);
        const nextRetry = d.getNextRetryAt ? d.getNextRetryAt() : d.nextRetryAt;
        const delayMs = nextRetry ? Math.max(0, new Date(nextRetry).getTime() - Date.now()) : 5000;

        if (this.queue) {
          if (typeof this.queue.enqueueDelivery === 'function') {
            await this.queue.enqueueDelivery(trId, destId, retryCount + 1, delayMs);
          } else if (typeof this.queue.add === 'function') {
            await this.queue.add('deliver-task-result', { deliveryId: d.getId?.() || d.id }, { delay: delayMs });
          }
        }
        delayed++;
      }

      // 4. Query FAILED_DLQ records
      const dlqDeliveries = await findByStatus('FAILED_DLQ');
      dlq = dlqDeliveries.length;

      this.logger?.info?.(`Queue reconstruction finished. Main: ${main}, Delayed: ${delayed}, DLQ: ${dlq}`);
    } catch (err: any) {
      this.logger?.error?.(`Failed to rebuild queues: ${err.message}`);
      throw err;
    }

    return { main, delayed, dlq };
  }

  /**
   * Convenience alias method returning rebuild stats object.
   */
  public async rebuildQueues(): Promise<RebuildResult> {
    return this.rebuild();
  }
}
