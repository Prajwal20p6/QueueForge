export interface BulkheadStats {
  active: number;
  queued: number;
  total: number;
  rejected: number;
  totalAcquires: number;
  totalReleases: number;
}

/**
 * Metric collector tracking active, queued, completed, and rejected execution statistics for Bulkhead instances.
 */
export class BulkheadMetrics {
  private active = 0;
  private queued = 0;
  private rejected = 0;
  private totalAcquires = 0;
  private totalReleases = 0;

  constructor(private readonly maxCapacity: number) {}

  public recordAcquire(): void {
    this.active++;
    this.totalAcquires++;
  }

  public recordRelease(): void {
    this.active = Math.max(0, this.active - 1);
    this.totalReleases++;
  }

  public recordQueued(): void {
    this.queued++;
  }

  public recordDequeued(): void {
    this.queued = Math.max(0, this.queued - 1);
  }

  public recordRejection(): void {
    this.rejected++;
  }

  public getMetrics(): BulkheadStats {
    return {
      active: this.active,
      queued: this.queued,
      total: this.maxCapacity,
      rejected: this.rejected,
      totalAcquires: this.totalAcquires,
      totalReleases: this.totalReleases,
    };
  }

  public reset(): void {
    this.active = 0;
    this.queued = 0;
    this.rejected = 0;
    this.totalAcquires = 0;
    this.totalReleases = 0;
  }
}
