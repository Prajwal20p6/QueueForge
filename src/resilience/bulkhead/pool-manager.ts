import { PoolExhaustedError } from '../types';

/**
 * Manage concurrency limits and active worker slot states in memory.
 */
export class PoolManager {
  private readonly activeWorkers = new Set<string>();

  constructor(
    public readonly poolName: string,
    public readonly maxSize: number
  ) {}

  public getAvailableSlots(): number {
    return Math.max(0, this.maxSize - this.activeWorkers.size);
  }

  /**
   * Reserves a worker slot in memory, throwing PoolExhaustedError if full.
   */
  public async acquire(workerId: string, _timeoutMs?: number): Promise<void> {
    if (this.activeWorkers.has(workerId)) {
      // Worker already occupies a slot
      return;
    }

    if (this.activeWorkers.size >= this.maxSize) {
      throw new PoolExhaustedError(this.poolName);
    }

    this.activeWorkers.add(workerId);
  }

  /**
   * Releases a worker slot.
   */
  public async release(workerId: string): Promise<void> {
    this.activeWorkers.delete(workerId);
  }

  /**
   * Aggregates active size and utilization rates.
   */
  public getStats(): {
    maxSize: number;
    available: number;
    active: number;
    utilization: number;
  } {
    const active = this.activeWorkers.size;
    const available = this.getAvailableSlots();
    const utilization = this.maxSize > 0 ? (active / this.maxSize) * 100 : 0;

    return {
      maxSize: this.maxSize,
      available,
      active,
      utilization,
    };
  }
}
