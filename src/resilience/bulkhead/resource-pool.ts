import { BulkheadFullError } from '../errors/bulkhead-full-error';

interface WaitingAcquire {
  resolve: () => void;
  reject: (err: Error) => void;
  timer?: NodeJS.Timeout;
}

/**
 * Concurrency slot pool managing resource acquisition with a fair FIFO wait queue and configurable timeout limits.
 */
export class ResourcePool {
  private inUse = 0;
  private readonly queue: WaitingAcquire[] = [];

  constructor(
    public readonly maxSize: number,
    private readonly logger?: any
  ) {
    if (maxSize <= 0) {
      throw new Error('ResourcePool maxSize must be greater than 0');
    }
  }

  public isFull(): boolean {
    return this.inUse >= this.maxSize;
  }

  public getStats(): { available: number; inUse: number; total: number; queued: number } {
    return {
      available: Math.max(0, this.maxSize - this.inUse),
      inUse: this.inUse,
      total: this.maxSize,
      queued: this.queue.length,
    };
  }

  public async acquire(timeoutMs: number = 30000, name: string = 'ResourcePool'): Promise<void> {
    const success = await this.tryAcquire(timeoutMs, name);
    if (!success) {
      throw new BulkheadFullError(name);
    }
  }

  public tryAcquire(timeoutMs: number = 30000, name: string = 'ResourcePool'): Promise<boolean> {
    if (this.inUse < this.maxSize) {
      this.inUse++;
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      let timer: NodeJS.Timeout | undefined;

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          // Remove from queue on timeout
          const idx = this.queue.findIndex(item => item.timer === timer);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
          }
          this.logger?.warn?.(`[ResourcePool:${name}] Acquire attempt timed out after ${timeoutMs}ms`);
          resolve(false);
        }, timeoutMs);
      }

      this.queue.push({
        resolve: () => {
          if (timer) clearTimeout(timer);
          this.inUse++;
          resolve(true);
        },
        reject: () => {
          if (timer) clearTimeout(timer);
          resolve(false);
        },
        timer,
      });
    });
  }

  public release(): void {
    if (this.inUse <= 0) {
      return;
    }
    this.inUse--;

    // Grant slot to next waiting request in FIFO order
    if (this.queue.length > 0) {
      const nextRequest = this.queue.shift();
      if (nextRequest) {
        nextRequest.resolve();
      }
    }
  }
}
