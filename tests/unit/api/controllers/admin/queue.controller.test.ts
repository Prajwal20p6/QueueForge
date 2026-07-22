import { AdminQueueController } from '../../../../../src/api/controllers/admin/queue.controller';
import { MockFactory } from '../../../../helpers/mocks';

describe('AdminQueueController Unit Tests', () => {
  let controller: AdminQueueController;

  beforeEach(() => {
    const logger = MockFactory.createMockLogger();
    controller = new AdminQueueController(logger);
  });

  it('should pause queue and return status 200', async () => {
    const req = { body: { name: 'results-queue' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await controller.pauseQueue(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'paused', queueName: 'results-queue' });
  });

  it('should clear queue when safety confirmation matches', async () => {
    const req = { body: { name: 'results-queue', confirm: true } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await controller.clearQueue(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cleared', purgedCount: 15 })
    );
  });

  it('should reject clear queue when confirmation is missing', async () => {
    const req = { body: { name: 'results-queue' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await controller.clearQueue(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
