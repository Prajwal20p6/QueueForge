import { AdminDeliveryController } from '../../../../../src/api/controllers/admin/delivery.controller';
import { MockFactory } from '../../../../helpers/mocks';

describe('AdminDeliveryController Unit Tests', () => {
  it('should trigger retry DLQ delivery and return 200', async () => {
    const logger = MockFactory.createMockLogger();
    const controller = new AdminDeliveryController(logger);

    const req = { body: { deliveryId: 'd-123' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await controller.retryDLQDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'queued', deliveryId: 'd-123' });
  });
});
