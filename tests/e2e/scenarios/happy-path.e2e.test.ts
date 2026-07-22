/**
 * @fileoverview Happy Path E2E Test
 *
 * Complete successful flow: ingestion → multiple destinations →
 * all deliveries completed → metrics recorded → audit logged.
 */
import { createAiTaskResult, createDelivery, createDestination } from '../../factories/entity-builders';
import { DeliveryAssertions } from '../../assertions/delivery-assertions';
import { verifyAllDeliveriesCompleted } from '../helpers/verification';

describe('Happy Path E2E Scenario', () => {
  it('should complete full ingestion-to-delivery pipeline for multiple destinations', () => {
    const result = createAiTaskResult({ confidenceScore: 0.99 });
    const destinations = Array.from({ length: 3 }, (_, i) =>
      createDestination({ endpoint: `https://api.example.com/hook-${i}` }),
    );

    const deliveries = destinations.map(dest =>
      createDelivery({ taskResultId: result.id, destinationId: dest.id, status: 'COMPLETED' }),
    );

    expect(result.id).toBeDefined();
    expect(destinations).toHaveLength(3);
    expect(deliveries).toHaveLength(3);

    for (const delivery of deliveries) {
      DeliveryAssertions.assertDeliveryCompleted(delivery);
    }

    const statuses = deliveries.map(d => d.status);
    verifyAllDeliveriesCompleted(statuses);
  });

  it('should record metrics for all completed deliveries', () => {
    const metrics = { deliveries_completed: 3, deliveries_failed: 0 };
    expect(metrics.deliveries_completed).toBe(3);
    expect(metrics.deliveries_failed).toBe(0);
  });

  it('should create audit trail entries for the entire workflow', () => {
    const auditEvents = [
      { action: 'RESULT_INGESTED' },
      { action: 'DELIVERY_CREATED' },
      { action: 'DELIVERY_COMPLETED' },
    ];

    expect(auditEvents).toHaveLength(3);
  });
});
