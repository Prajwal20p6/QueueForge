import { ErrorClassifier } from '../../../../src/worker/processor/error-classifier';

describe('ErrorClassifier Unit Tests', () => {
  let classifier: ErrorClassifier;
  let logger: any;
  let config: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    config = {
      permanentStatusCodes: [400, 401, 403, 404, 422],
      retryableStatusCodes: [500, 502, 503, 504],
    };
    classifier = new ErrorClassifier(logger, config);
  });

  it('should classify http codes as retryable or permanent correctly', () => {
    const res500 = classifier.classifyHttpStatus(500);
    expect(res500.isRetryable).toBe(true);
    expect(res500.category).toBe('TRANSIENT');

    const res404 = classifier.classifyHttpStatus(404);
    expect(res404.isRetryable).toBe(false);
    expect(res404.category).toBe('PERMANENT');

    const res408 = classifier.classifyHttpStatus(408);
    expect(res408.isRetryable).toBe(true);
    expect(res408.category).toBe('TIMEOUT');
  });

  it('should classify exceptions correctly by message keywords', () => {
    const timeoutErr = classifier.classify(new Error('ETIMEDOUT connection timeout'));
    expect(timeoutErr.isRetryable).toBe(true);
    expect(timeoutErr.category).toBe('TIMEOUT');

    const networkErr = classifier.classify(new Error('read ECONNRESET network crash'));
    expect(networkErr.isRetryable).toBe(true);
    expect(networkErr.category).toBe('NETWORK');

    const validationErr = classifier.classify(new Error('validation error schema constraint'));
    expect(validationErr.isRetryable).toBe(false);
    expect(validationErr.category).toBe('VALIDATION');
  });
});
