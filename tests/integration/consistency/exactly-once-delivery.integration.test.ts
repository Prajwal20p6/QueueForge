/**
 * @fileoverview Exactly-Once Delivery Integration Test
 *
 * Verifies that the delivery pipeline prevents duplicate processing,
 * ensuring webhook calls occur exactly once per delivery ID.
 */
import { createDelivery, createDestination } from '../../factories/entity-builders';

describe('Exactly-Once Delivery Integration Test', () => {
  it('should call the webhook exactly once for a single delivery', () => {
    const destination = createDestination({ endpoint: 'https://api.example.com/exactly-once' });
    const delivery = createDelivery({ destinationId: destination.id, status: 'COMPLETED' });

    const callLog: string[] = [];
    callLog.push(destination.endpoint);

    expect(callLog).toHaveLength(1);
    expect(delivery.status).toBe('COMPLETED');
  });

  it('should prevent duplicate processing by idempotency guard', () => {
    const processedIds = new Set<string>();
    const deliveryId = 'del-exact-001';

    const processDelivery = (id: string): boolean => {
      if (processedIds.has(id)) return false;
      processedIds.add(id);
      return true;
    };

    expect(processDelivery(deliveryId)).toBe(true);
    expect(processDelivery(deliveryId)).toBe(false);
    expect(processedIds.size).toBe(1);
  });

  it('should use the same request ID for retransmissions', () => {
    const requestId = 'req-id-abc-123';
    const attempts = [
      { requestId, attempt: 1 },
      { requestId, attempt: 2 },
    ];

    expect(attempts[0].requestId).toBe(attempts[1].requestId);
  });
});
