import { DestinationController } from '../../../../src/api/controllers/destination.controller';

describe('DestinationController Unit Tests', () => {
  let controller: DestinationController;
  let mockDestinationService: any;
  let mockFindService: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockDestinationService = {
      register: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockFindService = {
      listDestinations: jest.fn(),
      getDestination: jest.fn(),
    };

    controller = new DestinationController(mockDestinationService, mockFindService);

    req = { params: {}, query: {}, body: {}, correlationId: 'dest-trace-123' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn() };
    next = jest.fn();
  });

  it('should create destination and return 201 Created', async () => {
    req.body = {
      type: 'WEBHOOK',
      endpoint: 'https://webhook.site/test',
    };
    mockDestinationService.register.mockResolvedValue({ id: 'dest-101', type: 'WEBHOOK', endpoint: 'https://webhook.site/test' });

    await controller.createDestination(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/api/v1/destinations/dest-101');
  });

  it('should delete destination and return 204 No Content', async () => {
    req.params.destinationId = 'dest-101';

    await controller.deleteDestination(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
