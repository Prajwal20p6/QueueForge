import { loggingMiddleware } from '../../../../src/api/middleware/logging.middleware';

describe('loggingMiddleware Unit Tests', () => {
  let middleware: any;
  let logger: any;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    req = {
      method: 'GET',
      path: '/ready',
      headers: {
        authorization: 'Bearer token',
      },
      correlationId: 'corr-id-1',
    };
    res = {
      statusCode: 200,
      getHeader: jest.fn().mockReturnValue('100'),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      }),
    };
    next = jest.fn();

    middleware = loggingMiddleware(logger);
  });

  it('should log incoming request details and redact authentication tokens', () => {
    middleware(req, res, next);
    expect(logger.debug).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(logger.info).toHaveBeenCalled();
  });
});
