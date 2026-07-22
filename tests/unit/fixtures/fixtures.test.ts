import { AiTaskResultFixtures } from '../../fixtures/ai-task-results.fixtures';
import { DeliveryFixtures } from '../../fixtures/deliveries.fixtures';
import { DestinationFixtures } from '../../fixtures/destinations.fixtures';

describe('Fixtures Generator Unit Tests', () => {
  it('should generate high and low confidence AiTaskResult fixtures', () => {
    const high = AiTaskResultFixtures.highConfidenceResult();
    const low = AiTaskResultFixtures.lowConfidenceResult();

    expect(high.confidenceScore).toBe(0.99);
    expect(low.confidenceScore).toBe(0.15);
  });

  it('should generate multiple delivery fixtures by status', () => {
    const pending = DeliveryFixtures.pendingDelivery();
    const completed = DeliveryFixtures.completedDelivery();
    const batch = DeliveryFixtures.deliveriesByStatus('PROCESSING', 5);

    expect(pending.status).toBe('PENDING');
    expect(completed.status).toBe('COMPLETED');
    expect(batch).toHaveLength(5);
    expect(batch[0].status).toBe('PROCESSING');
  });

  it('should generate webhook and multiple destination fixtures', () => {
    const webhook = DestinationFixtures.webhookDestination();
    const list = DestinationFixtures.multipleDestinations(3);

    expect(webhook.type).toBe('WEBHOOK');
    expect(list).toHaveLength(3);
  });
});
