import { correlationIdMiddleware } from '../../../../src/api/middleware/correlation-id.middleware';

describe('correlationIdMiddleware Unit Tests', () => {
  let middleware: any;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      setHeader: jest.fn(),
    };
    next = jest.fn();

    middleware = correlationIdMiddleware();
  });

  it('should generate new correlation ID if not present in request headers', () => {
    middleware(req, res, next);
    expect(req.correlationId).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
    expect(next).toHaveBeenCalled();
  });

  it('should reuse existing correlation ID from headers if present', () => {
    req.headers['x-correlation-id'] = 'existing-id-123';
    middleware(req, res, next);
    expect(req.correlationId).toBe('existing-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'existing-id-123');
    expect(next).toHaveBeenCalled();
  });
});
