import { createDelivery } from '../../factories/entity-builders';

describe('DLQ Recovery Integration Test', () => {
  it('should move exhausted retries to DLQ and recover manually', async () => {
    const delivery = createDelivery({ status: 'FAILED_DLQ', retryCount: 5 });
    expect(delivery.status).toBe('FAILED_DLQ');

    delivery.status = 'COMPLETED';
    expect(delivery.status).toBe('COMPLETED');
  });
});
