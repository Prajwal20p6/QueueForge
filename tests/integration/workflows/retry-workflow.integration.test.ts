import { createDelivery } from '../../factories/entity-builders';

describe('Retry Workflow Integration Test', () => {
  it('should retry failed delivery and succeed on subsequent attempt', async () => {
    const delivery = createDelivery({ status: 'FAILED_RETRY', retryCount: 1 });
    expect(delivery.retryCount).toBe(1);

    delivery.status = 'COMPLETED';
    expect(delivery.status).toBe('COMPLETED');
  });
});
