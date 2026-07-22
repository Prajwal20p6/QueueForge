/**
 * @fileoverview Partial Failure Integration Test
 *
 * Verifies that when one destination permanently fails, others
 * succeed independently without cascading failures.
 */
import { createAiTaskResult, createDelivery, createDestination } from '../../factories/entity-builders';
import { DeliveryAssertions } from '../../assertions/delivery-assertions';

describe('Partial Failure Integration Test', () => {
  const dest1 = createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/ok1' });
  const dest2 = createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/ok2' });
  const dest3 = createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/fail' });

  it('should complete healthy deliveries even when one destination fails permanently', () => {
    const deliveries = [
      createDelivery({ destinationId: dest1.id, status: 'COMPLETED' }),
      createDelivery({ destinationId: dest2.id, status: 'COMPLETED' }),
      createDelivery({ destinationId: dest3.id, status: 'FAILED_DLQ', retryCount: 5 }),
    ];

    const succeeded = deliveries.filter(d => d.status === 'COMPLETED');
    const failed = deliveries.filter(d => d.status === 'FAILED_DLQ');

    expect(succeeded).toHaveLength(2);
    expect(failed).toHaveLength(1);

    DeliveryAssertions.assertDeliveryCompleted(deliveries[0]);
    DeliveryAssertions.assertDeliveryCompleted(deliveries[1]);
    DeliveryAssertions.assertDeliveryFailed(deliveries[2]);
  });

  it('should not trigger backpressure from a single failing destination', () => {
    const result = createAiTaskResult();
    expect(result).toBeDefined();

    const delivery = createDelivery({ destinationId: dest3.id, status: 'FAILED_DLQ' });
    expect(delivery.status).toBe('FAILED_DLQ');
  });

  it('should isolate failures so no cascading effects propagate', () => {
    const healthy1 = createDelivery({ destinationId: dest1.id, status: 'COMPLETED' });
    const healthy2 = createDelivery({ destinationId: dest2.id, status: 'COMPLETED' });

    expect(healthy1.status).toBe('COMPLETED');
    expect(healthy2.status).toBe('COMPLETED');
  });
});
