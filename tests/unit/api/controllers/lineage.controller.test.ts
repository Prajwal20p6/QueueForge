import { LineageController } from '../../../../src/api/controllers/lineage.controller';

describe('LineageController Unit Tests', () => {
  let controller: LineageController;
  let mockResultService: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockResultService = {
      getLineage: jest.fn(),
    };

    controller = new LineageController(mockResultService);

    req = { params: {}, query: {}, correlationId: 'lineage-trace-123' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should return lineage trace logs successfully with status 200', async () => {
    req.params.emailId = 'user@example.com';
    mockResultService.getLineage.mockResolvedValue({ emailId: 'user@example.com', records: [{ id: 'res-1' }] });

    await controller.getLineage(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ emailId: 'user@example.com' }),
    }));
  });

  it('should throw NotFoundError if no task result records map to target email', async () => {
    req.params.emailId = 'unknown@example.com';
    mockResultService.getLineage.mockResolvedValue(null);

    await controller.getLineage(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
