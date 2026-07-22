import { errorHandlerMiddleware } from '../../../../src/api/middleware/error-handler.middleware';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('errorHandlerMiddleware Unit Tests', () => {
  let mockLogger: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    req = { method: 'POST', originalUrl: '/api/v1/results', correlationId: 'err-trace-123' };
    res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should catch ValidationError and respond with 422 JSON envelope', () => {
    const err = new ValidationError('emailId', 'Invalid email address format');
    const middleware = errorHandlerMiddleware(mockLogger);

    middleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Unprocessable Entity',
      code: 'VALIDATION_FAILED',
      traceId: 'err-trace-123',
    }));
  });
});
