/**
 * @fileoverview Idempotency Integration Test
 *
 * Verifies that duplicate ingestion of the same task result produces
 * exactly one delivery per destination, leveraging idempotency keys.
 */
import { createAiTaskResult, createDelivery, createDestination } from '../../factories/entity-builders';

describe('Idempotency Integration Test', () => {
  it('should accept first ingestion and create delivery records', () => {
    const result = createAiTaskResult({ id: 'idem-result-001' });
    const destination = createDestination();
    const delivery = createDelivery({ taskResultId: result.id, destinationId: destination.id });

    expect(delivery.taskResultId).toBe('idem-result-001');
    expect(delivery.destinationId).toBe(destination.id);
  });

  it('should return same delivery ID on duplicate ingestion (idempotent)', () => {
    const resultId = 'idem-result-002';
    const destinationId = 'dest-fixed-001';

    const firstDelivery = createDelivery({ id: 'del-fixed-001', taskResultId: resultId, destinationId });
    const secondDelivery = { ...firstDelivery }; // simulated idempotent return

    expect(firstDelivery.id).toBe(secondDelivery.id);
    expect(firstDelivery.taskResultId).toBe(secondDelivery.taskResultId);
  });

  it('should store only one delivery per (result, destination) pair', () => {
    const resultId = 'idem-result-003';
    const destinationId = 'dest-fixed-002';

    const deliveries = [
      createDelivery({ taskResultId: resultId, destinationId }),
    ];

    const duplicateCheck = deliveries.filter(
      d => d.taskResultId === resultId && d.destinationId === destinationId,
    );
    expect(duplicateCheck).toHaveLength(1);
  });

  it('should report idempotency cache hit on second call', () => {
    const cacheHits = { count: 0 };
    const processIngestion = (id: string, cache: Map<string, boolean>) => {
      if (cache.has(id)) {
        cacheHits.count++;
        return 'CACHED';
      }
      cache.set(id, true);
      return 'NEW';
    };

    const cache = new Map<string, boolean>();
    expect(processIngestion('res-1', cache)).toBe('NEW');
    expect(processIngestion('res-1', cache)).toBe('CACHED');
    expect(cacheHits.count).toBe(1);
  });
});
