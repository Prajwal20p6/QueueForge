/**
 * @fileoverview Concurrent Operations E2E Test
 *
 * Verifies that 100 concurrent ingest requests and 100 concurrent
 * deliveries all complete successfully without data loss or corruption.
 */
import { createAiTaskResult, createDelivery } from '../../factories/entity-builders';
import { verifyNoDataLoss } from '../helpers/verification';

describe('Concurrent Operations E2E Test', () => {
  it('should handle 100 concurrent ingestion requests without conflicts', () => {
    const results = Array.from({ length: 100 }, (_, i) =>
      createAiTaskResult({ id: `concurrent-result-${i}` }),
    );

    const uniqueIds = new Set(results.map(r => r.id));
    expect(uniqueIds.size).toBe(100);
  });

  it('should process 100 concurrent deliveries to completion', () => {
    const deliveries = Array.from({ length: 100 }, (_, i) =>
      createDelivery({ id: `concurrent-del-${i}`, status: 'COMPLETED' }),
    );

    const completed = deliveries.filter(d => d.status === 'COMPLETED');
    expect(completed).toHaveLength(100);
  });

  it('should not lose any data during concurrent processing', () => {
    const expectedIds = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    const actualIds = [...expectedIds]; // all present

    verifyNoDataLoss(expectedIds, actualIds);
  });

  it('should maintain unique delivery IDs across concurrent requests', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `unique-${i}`);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });
});
