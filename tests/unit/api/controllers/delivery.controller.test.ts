import { DeliveryController } from '../../../../src/api/controllers/delivery.controller';

describe('DeliveryController Unit Tests', () => {
  let controller: DeliveryController;
  let mockDeliveryService: any;
  let mockRetryService: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockDeliveryService = {
      getDelivery: jest.fn(),
      listDeliveries: jest.fn(),
      retry: jest.fn(),
    };
    mockRetryService = {
      scheduleRetry: jest.fn(),
    };

    controller = new DeliveryController(mockDeliveryService, mockRetryService);

    req = { params: {}, query: {}, body: {}, correlationId: 'trace-123' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should get delivery by ID successfully', async () => {
    req.params.deliveryId = 'del-123';
    mockDeliveryService.getDelivery.mockResolvedValue({ id: 'del-123', status: 'DELIVERED' });

    await controller.getDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'del-123', status: 'DELIVERED' } }));
  });

  it('should list deliveries paginated', async () => {
    req.query = { page: '1', limit: '10' };
    mockDeliveryService.listDeliveries.mockResolvedValue({ items: [{ id: 'del-1' }, { id: 'del-2' }], total: 2 });

    await controller.listDeliveries(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: [{ id: 'del-1' }, { id: 'del-2' }],
      pagination: expect.objectContaining({ total: 2 }),
    }));
  });

  it('should trigger manual retry and return 202 Accepted', async () => {
    req.params.deliveryId = 'del-failed-1';

    await controller.retryDelivery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACCEPTED' }));
  });
});
