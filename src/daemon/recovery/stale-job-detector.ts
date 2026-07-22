/**
 * Detector identifying stale deliveries, orphaned queue messages, and dead worker heartbeats.
 */
export class StaleJobDetector {
  private readonly defaultTimeoutMs: number;

  constructor(
    private readonly deliveryRepository: any,
    private readonly heartbeat?: any,
    config?: any,
    private readonly logger?: any
  ) {
    this.defaultTimeoutMs = config?.staleTimeoutMs || 30000;
  }

  /**
   * Scans database for deliveries stuck in PROCESSING state without updates within timeoutMs.
   */
  public async detectStale(timeoutMs: number = this.defaultTimeoutMs): Promise<any[]> {
    const cutoff = new Date(Date.now() - timeoutMs);
    this.logger?.debug?.(`[StaleJobDetector] Scanning for PROCESSING deliveries updated before ${cutoff.toISOString()}`);

    try {
      if (this.deliveryRepository && typeof this.deliveryRepository.findStaleDeliveries === 'function') {
        return await this.deliveryRepository.findStaleDeliveries(cutoff);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findMany === 'function') {
        const results = await this.deliveryRepository.findMany({
          status: 'PROCESSING',
          updatedBefore: cutoff,
        });
        return results || [];
      }
      return [];
    } catch (err: any) {
      this.logger?.error?.(`[StaleJobDetector] Error detecting stale deliveries: ${err.message}`);
      return [];
    }
  }

  /**
   * Identifies queue jobs whose delivery records no longer exist in database.
   */
  public async detectOrphaned(queueJobs: any[] = []): Promise<any[]> {
    const orphaned: any[] = [];
    for (const job of queueJobs) {
      const deliveryId = job?.data?.deliveryId || job?.data?.id || job?.id;
      if (!deliveryId) continue;

      let exists = false;
      if (this.deliveryRepository && typeof this.deliveryRepository.findById === 'function') {
        const record = await this.deliveryRepository.findById(deliveryId);
        exists = !!record;
      }
      if (!exists) {
        orphaned.push(job);
      }
    }
    return orphaned;
  }

  /**
   * Queries heartbeat registry for dead or unresponsive worker IDs.
   */
  public async detectDeadWorkers(): Promise<string[]> {
    if (!this.heartbeat) return [];
    try {
      if (typeof this.heartbeat.getAllWorkerIds === 'function') {
        const allIds: string[] = await this.heartbeat.getAllWorkerIds();
        const dead: string[] = [];
        for (const id of allIds) {
          const alive = await this.heartbeat.isAlive(id);
          if (!alive) dead.push(id);
        }
        return dead;
      }
    } catch {
      // ignore
    }
    return [];
  }
}
