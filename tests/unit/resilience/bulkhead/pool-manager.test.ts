import { PoolManager } from '../../../../src/resilience/bulkhead/pool-manager';
import { PoolExhaustedError } from '../../../../src/resilience/types';

describe('PoolManager Unit Tests', () => {
  let poolManager: PoolManager;

  beforeEach(() => {
    poolManager = new PoolManager('webhook-pool', 2);
  });

  it('should acquire slots and decrement available counts', async () => {
    expect(poolManager.getAvailableSlots()).toBe(2);

    await poolManager.acquire('worker-1');
    expect(poolManager.getAvailableSlots()).toBe(1);

    await poolManager.acquire('worker-2');
    expect(poolManager.getAvailableSlots()).toBe(0);
  });

  it('should throw PoolExhaustedError if concurrency limit reached', async () => {
    await poolManager.acquire('worker-1');
    await poolManager.acquire('worker-2');

    await expect(poolManager.acquire('worker-3')).rejects.toThrow(PoolExhaustedError);
  });

  it('should reclaim slots on release execution', async () => {
    await poolManager.acquire('worker-1');
    await poolManager.acquire('worker-2');

    await poolManager.release('worker-1');
    expect(poolManager.getAvailableSlots()).toBe(1);

    const stats = poolManager.getStats();
    expect(stats.active).toBe(1);
    expect(stats.utilization).toBe(50);
  });
});
