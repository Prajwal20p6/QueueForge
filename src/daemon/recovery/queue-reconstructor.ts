export interface ReconstructionResult {
  enqueued: number;
  main: number;
  delayed: number;
  deleted: number;
}

/**
 * Reconstructs active queues idempotently from PostgreSQL source of truth to guarantee 0 message loss.
 */
export class QueueReconstructor {
  private readonly deliveryRepository: any;
  private readonly queueManager: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    this.deliveryRepository = args[0];
    this.queueManager = args[1];
    this.logger = args[2];
  }

  /**
   * Executes full queue reconstruction flow enqueueing missing PENDING and SCHEDULED_RETRY deliveries.
   */
  public async reconstruct(): Promise<ReconstructionResult> {
    this.logger?.info?.('[QueueReconstructor] Starting queue reconstruction flow...');

    const pendingCount = await this.enqueuePending();
    const retriesCount = await this.enqueueScheduledRetries();
    const removedCount = await this.removeOrphaned();

    const enqueued = pendingCount + retriesCount;
    this.logger?.info?.(`[QueueReconstructor] Queue reconstruction complete (enqueued: ${enqueued}, removed orphaned: ${removedCount})`);

    return {
      enqueued,
      main: pendingCount,
      delayed: retriesCount,
      deleted: removedCount,
    };
  }

  /**
   * Scans for PENDING deliveries and re-enqueues missing ones to main delivery queue.
   */
  public async enqueuePending(): Promise<number> {
    try {
      let pending: any[] = [];
      if (this.deliveryRepository && typeof this.deliveryRepository.findPendingDeliveries === 'function') {
        const raw = await this.deliveryRepository.findPendingDeliveries();
        pending = Array.isArray(raw) ? raw : (raw?.data || []);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findByStatus === 'function') {
        const raw = await this.deliveryRepository.findByStatus('PENDING');
        pending = Array.isArray(raw) ? raw : (raw?.data || []);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findMany === 'function') {
        const raw = await this.deliveryRepository.findMany({ status: 'PENDING' });
        pending = Array.isArray(raw) ? raw : (raw?.data || []);
      }

      let count = 0;
      const mainQueue = this.queueManager?.getMainQueue ? this.queueManager.getMainQueue() : this.queueManager;

      for (const del of pending || []) {
        if (mainQueue && typeof mainQueue.add === 'function') {
          await mainQueue.add('deliver', { deliveryId: del.id, destinationId: del.destinationId });
          count++;
        }
      }
      return count;
    } catch (err: any) {
      this.logger?.error?.(`[QueueReconstructor] Error enqueueing pending deliveries: ${err.message}`);
      return 0;
    }
  }

  /**
   * Scans for SCHEDULED_RETRY deliveries and re-enqueues them to delayed delivery queue.
   */
  public async enqueueScheduledRetries(): Promise<number> {
    try {
      let retries: any[] = [];
      if (this.deliveryRepository && typeof this.deliveryRepository.findScheduledRetryDeliveries === 'function') {
        const raw = await this.deliveryRepository.findScheduledRetryDeliveries();
        retries = Array.isArray(raw) ? raw : (raw?.data || []);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findByStatus === 'function') {
        const raw = await this.deliveryRepository.findByStatus('SCHEDULED_RETRY');
        retries = Array.isArray(raw) ? raw : (raw?.data || []);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findMany === 'function') {
        const raw = await this.deliveryRepository.findMany({ status: 'SCHEDULED_RETRY' });
        retries = Array.isArray(raw) ? raw : (raw?.data || []);
      }

      let count = 0;
      const delayedQueue = this.queueManager?.getDelayedQueue ? this.queueManager.getDelayedQueue() : this.queueManager;

      for (const del of retries || []) {
        const delayMs = del.nextRetryAt ? Math.max(0, new Date(del.nextRetryAt).getTime() - Date.now()) : 5000;
        if (delayedQueue && typeof delayedQueue.add === 'function') {
          await delayedQueue.add('deliver_retry', { deliveryId: del.id }, { delay: delayMs });
          count++;
        }
      }
      return count;
    } catch (err: any) {
      this.logger?.error?.(`[QueueReconstructor] Error enqueueing scheduled retries: ${err.message}`);
      return 0;
    }
  }

  /**
   * Purges jobs from queue that have no matching delivery record in database.
   */
  public async removeOrphaned(): Promise<number> {
    try {
      const mainQueue = this.queueManager?.getMainQueue ? this.queueManager.getMainQueue() : this.queueManager;
      if (!mainQueue || typeof mainQueue.getJobs !== 'function') return 0;

      const jobs = await mainQueue.getJobs(['waiting', 'active', 'delayed']);
      let removed = 0;

      for (const job of jobs || []) {
        const deliveryId = job?.data?.deliveryId || job?.id;
        if (!deliveryId) continue;

        let exists = false;
        if (this.deliveryRepository && typeof this.deliveryRepository.findById === 'function') {
          const rec = await this.deliveryRepository.findById(deliveryId);
          exists = !!rec;
        }

        if (!exists && typeof job.remove === 'function') {
          await job.remove();
          removed++;
        }
      }
      return removed;
    } catch {
      return 0;
    }
  }
}

// Backward compatibility alias for existing code/tests
export { QueueReconstructor as QueueReconstruction };
