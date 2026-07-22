import { ResultController } from '../../../../src/api/controllers/result.controller';
import { IngestResultService } from '../../../../src/application/services/ingest-result.service';

describe('ResultController Unit Tests', () => {
  let controller: ResultController;
  let mockIngestService: jest.Mocked<IngestResultService>;
  let mockRepository: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockIngestService = {
      ingest: jest.fn(),
    } as any;

    mockRepository = {
      findById: jest.fn(),
    };

    controller = new ResultController(mockIngestService, undefined, undefined, undefined, mockRepository);

    req = {
      body: {},
      params: {},
      query: {},
      header: jest.fn(),
      correlationId: 'test-trace-123',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    next = jest.fn();
  });

  it('should ingest result and respond with 202 Accepted', async () => {
    req.body = {
      emailId: 'user@example.com',
      agentId: 'classifier-agent',
      confidenceScore: 0.95,
      resultPayload: { category: 'BILLING' },
    };

    mockIngestService.ingest.mockResolvedValue({
      resultId: 'res-12345',
      status: 'QUEUED',
      destinationCount: 2,
      timestamp: new Date(),
    } as any);

    await controller.ingestResult(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/api/v1/results/res-12345');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACCEPTED' }));
  });

  it('should retrieve result by ID and respond 200 OK', async () => {
    req.params.resultId = 'res-12345';
    mockRepository.findById.mockResolvedValue({ id: 'res-12345', emailId: 'user@example.com' });

    await controller.getResult(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id: 'res-12345' }),
    }));
  });

  it('should call next with NotFoundError when result is not found', async () => {
    req.params.resultId = 'res-99999';
    mockRepository.findById.mockResolvedValue(null);

    await controller.getResult(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
