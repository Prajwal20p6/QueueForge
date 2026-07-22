import { MetricsController } from '../../../../src/api/controllers/metrics.controller';

describe('MetricsController Unit Tests', () => {
  let controller: MetricsController;
  let mockRegistry: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockRegistry = {
      metrics: jest.fn().mockResolvedValue('# HELP queueforge_metrics test\nqueueforge_metrics 1\n'),
      contentType: 'text/plain; version=0.0.4',
    };

    controller = new MetricsController(mockRegistry);

    req = {};
    res = { status: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn() };
    next = jest.fn();
  });

  it('should return Prometheus metrics text format with 200 OK', async () => {
    await controller.getMetrics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('queueforge_metrics'));
  });
});
