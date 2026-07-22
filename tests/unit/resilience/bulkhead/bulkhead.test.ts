import { Bulkhead } from '../../../../src/resilience/bulkhead/bulkhead';
import { BulkheadFullError } from '../../../../src/resilience/errors/bulkhead-full-error';

describe('Bulkhead Unit Tests', () => {
  it('should execute functions within concurrency limits and automatically release resources', async () => {
    const bulkhead = new Bulkhead('test-bulkhead', { maxConcurrent: 2, maxQueueSize: 5 });

    const task = jest.fn().mockResolvedValue('SUCCESS');

    const result = await bulkhead.execute(task);
    expect(result).toBe('SUCCESS');
    expect(task).toHaveBeenCalled();
    expect(bulkhead.getStats().active).toBe(0);
  });

  it('should reject execution when queue capacity is exceeded', async () => {
    const bulkhead = new Bulkhead('limited-bulkhead', { maxConcurrent: 1, maxQueueSize: 1, timeout: 50 });

    // Block concurrency slot
    const slowTask = bulkhead.execute(() => new Promise(res => setTimeout(res, 200)));
    // Fill queue slot
    const queuedTask = bulkhead.execute(() => new Promise(res => setTimeout(res, 200)));

    // Third call breaches queue capacity
    await expect(bulkhead.execute(async () => 'overflow')).rejects.toThrow(BulkheadFullError);

    await Promise.allSettled([slowTask, queuedTask]);
  });
});
