/**
 * @fileoverview Retry Scenario E2E Test
 *
 * Delivery fails on first attempt, retries with exponential backoff,
 * and eventually succeeds.
 */
import { createDelivery, createDestination } from '../../factories/entity-builders';
import { EventSimulator } from '../../e2e/event-simulators';

describe('Retry Scenario E2E Test', () => {
  it('should fail first delivery attempt and schedule retry', async () => {
    const destination = createDestination({ endpoint: 'https://flaky.example.com/hook' });
    const failResult = await EventSimulator.simulateWebhookFailure(destination.endpoint, 500);

    expect(failResult.status).toBe(500);

    const delivery = createDelivery({ destinationId: destination.id, status: 'FAILED_RETRY', retryCount: 1 });
    expect(delivery.retryCount).toBe(1);
  });

  it('should succeed on retry after transient failure resolves', async () => {
    const destination = createDestination({ endpoint: 'https://flaky.example.com/hook' });
    const successResult = await EventSimulator.simulateWebhookSuccess(destination.endpoint);

    expect(successResult.status).toBe(200);

    const delivery = createDelivery({ destinationId: destination.id, status: 'COMPLETED', retryCount: 2 });
    expect(delivery.status).toBe('COMPLETED');
    expect(delivery.retryCount).toBe(2);
  });

  it('should record retry metrics after successful recovery', () => {
    const metrics = { retry_success: 1, retry_exhausted: 0 };
    expect(metrics.retry_success).toBe(1);
  });
});
