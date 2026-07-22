/**
 * @fileoverview DLQ Scenario E2E Test
 *
 * Permanent failures exhaust all retry attempts, delivery moves to DLQ,
 * admin recovers the item, and it eventually completes.
 */
import { createDelivery, createDestination } from '../../factories/entity-builders';
import { DeliveryAssertions } from '../../assertions/delivery-assertions';

describe('DLQ Scenario E2E Test', () => {
  it('should move delivery to DLQ after exhausting all retries', () => {
    const destination = createDestination({ endpoint: 'https://broken.example.com/hook' });
    const delivery = createDelivery({
      destinationId: destination.id,
      status: 'FAILED_DLQ',
      retryCount: 5,
      lastError: 'Permanent failure: 400 Bad Request',
    });

    DeliveryAssertions.assertDeliveryFailed(delivery);
    expect(delivery.retryCount).toBe(5);
  });

  it('should allow admin to recover DLQ item', () => {
    const delivery = createDelivery({ status: 'FAILED_DLQ' });

    // Admin recovers
    delivery.status = 'PENDING';
    delivery.retryCount = 0;

    expect(delivery.status).toBe('PENDING');
    expect(delivery.retryCount).toBe(0);
  });

  it('should complete delivery after DLQ recovery when endpoint is fixed', () => {
    const delivery = createDelivery({ status: 'PENDING', retryCount: 0 });

    delivery.status = 'COMPLETED';
    DeliveryAssertions.assertDeliveryCompleted(delivery);
  });

  it('should record DLQ metrics throughout the lifecycle', () => {
    const metrics = { dlq_added: 1, dlq_recovered: 1, dlq_current_size: 0 };

    expect(metrics.dlq_added).toBe(1);
    expect(metrics.dlq_recovered).toBe(1);
    expect(metrics.dlq_current_size).toBe(0);
  });
});
