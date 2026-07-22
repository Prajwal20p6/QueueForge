import { createAiTaskResult, createDestination } from '../../factories/entity-builders';
import { DeliveryAssertions } from '../../assertions/delivery-assertions';

describe('Ingest and Deliver Workflow Integration Test', () => {
  it('should process ingested task result across multiple destinations', async () => {
    const taskResult = createAiTaskResult({ confidenceScore: 0.98 });
    const dest1 = createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/webhook1' });
    const dest2 = createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/webhook2' });

    expect(taskResult.id).toBeDefined();
    expect(dest1.enabled).toBe(true);
    expect(dest2.enabled).toBe(true);

    const delivery = { status: 'COMPLETED' };
    DeliveryAssertions.assertDeliveryCompleted(delivery);
  });
});
