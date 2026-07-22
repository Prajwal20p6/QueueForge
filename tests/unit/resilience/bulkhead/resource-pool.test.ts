import { ResourcePool } from '../../../../src/resilience/bulkhead/resource-pool';
import { BulkheadFullError } from '../../../../src/resilience/errors/bulkhead-full-error';

describe('ResourcePool Unit Tests', () => {
  it('should acquire and release concurrency slots up to capacity bounds', async () => {
    const pool = new ResourcePool(2);

    expect(pool.isFull()).toBe(false);
    expect(pool.getStats().available).toBe(2);

    await pool.acquire(1000);
    expect(pool.getStats().inUse).toBe(1);

    await pool.acquire(1000);
    expect(pool.isFull()).toBe(true);
    expect(pool.getStats().available).toBe(0);

    pool.release();
    expect(pool.isFull()).toBe(false);
    expect(pool.getStats().inUse).toBe(1);
  });

  it('should queue acquiring requests in FIFO order and grant slots upon release', async () => {
    const pool = new ResourcePool(1);
    await pool.acquire(1000);

    let granted = false;
    const queuedPromise = pool.acquire(1000).then(() => {
      granted = true;
    });

    expect(granted).toBe(false);
    expect(pool.getStats().queued).toBe(1);

    pool.release();
    await queuedPromise;
    expect(granted).toBe(true);
  });

  it('should throw BulkheadFullError when acquire times out in queue', async () => {
    const pool = new ResourcePool(1);
    await pool.acquire(1000);

    await expect(pool.acquire(50, 'TestPool')).rejects.toThrow(BulkheadFullError);
  });
});
