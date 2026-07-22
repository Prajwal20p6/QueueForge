import { HealthController } from '../../../../src/api/controllers/health.controller';

describe('HealthController Unit Tests', () => {
  let controller: HealthController;
  let mockDbPool: any;
  let mockRedisPool: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockDbPool = { ping: jest.fn().mockResolvedValue(true) };
    mockRedisPool = { ping: jest.fn().mockResolvedValue('PONG') };

    controller = new HealthController(mockDbPool, mockRedisPool);

    req = { correlationId: 'health-trace-123' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should return 200 health check status if database and redis are healthy', async () => {
    await controller.getHealth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'healthy' }),
    }));
  });

  it('should return 503 unhealthy if database ping fails', async () => {
    mockDbPool.ping.mockRejectedValue(new Error('Connection failed'));

    await controller.getHealth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'unhealthy' }),
    }));
  });
});
