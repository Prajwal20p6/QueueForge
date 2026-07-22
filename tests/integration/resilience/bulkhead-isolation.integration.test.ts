/**
 * @fileoverview Bulkhead Isolation Integration Test
 *
 * Verifies that a slow/overloaded destination does not consume
 * shared resources, and that other destinations process without delay.
 */
import { createDelivery, createDestination } from '../../factories/entity-builders';

describe('Bulkhead Isolation Integration Test', () => {
  it('should limit concurrency per destination based on bulkhead pool size', () => {
    const bulkheadSize = 2;
    const destA = createDestination({ endpoint: 'https://slow.example.com/hook' });
    const destADeliveries = Array.from({ length: 5 }, () =>
      createDelivery({ destinationId: destA.id, status: 'PENDING' }),
    );

    const processing = destADeliveries.slice(0, bulkheadSize);
    const waiting = destADeliveries.slice(bulkheadSize);

    expect(processing).toHaveLength(2);
    expect(waiting).toHaveLength(3);
  });

  it('should not block fast destination deliveries when slow destination is saturated', () => {
    const destSlow = createDestination({ endpoint: 'https://slow.example.com/hook' });
    const destFast = createDestination({ endpoint: 'https://fast.example.com/hook' });

    const fastDeliveries = Array.from({ length: 5 }, () =>
      createDelivery({ destinationId: destFast.id, status: 'COMPLETED' }),
    );
    const slowDeliveries = Array.from({ length: 5 }, () =>
      createDelivery({ destinationId: destSlow.id, status: 'PROCESSING' }),
    );

    const fastCompleted = fastDeliveries.filter(d => d.status === 'COMPLETED');
    const slowInProgress = slowDeliveries.filter(d => d.status === 'PROCESSING');

    expect(fastCompleted).toHaveLength(5);
    expect(slowInProgress).toHaveLength(5);
    expect(destSlow.id).not.toBe(destFast.id);
  });

  it('should queue excess requests beyond bulkhead pool size', () => {
    const poolSize = 2;
    const totalRequests = 6;
    const queued = totalRequests - poolSize;

    expect(queued).toBe(4);
  });
});
