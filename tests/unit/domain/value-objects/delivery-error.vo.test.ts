import { DeliveryError, DeliveryErrorCategory } from '../../../../src/domain/value-objects/delivery-error.vo';

describe('DeliveryError Value Object Unit Tests', () => {
  it('should categorize errors by HTTP status codes and test retryability', () => {
    const transientErr = DeliveryError.fromStatusCode(429, 'Rate limit exceeded');
    expect(transientErr.getCategory()).toBe(DeliveryErrorCategory.TRANSIENT);
    expect(transientErr.isRetryable()).toBe(true);

    const permanentErr = DeliveryError.fromStatusCode(404, 'Endpoint Not Found');
    expect(permanentErr.getCategory()).toBe(DeliveryErrorCategory.PERMANENT);
    expect(permanentErr.isRetryable()).toBe(false);

    const serverErr = DeliveryError.fromStatusCode(502, 'Bad Gateway');
    expect(serverErr.getCategory()).toBe(DeliveryErrorCategory.SERVER);
    expect(serverErr.isRetryable()).toBe(true);
  });

  it('should parse exception objects and detect network or timeout categories', () => {
    const netErr = DeliveryError.fromException(new Error('ECONNREFUSED 127.0.0.1:8080'));
    expect(netErr.getCategory()).toBe(DeliveryErrorCategory.NETWORK);
    expect(netErr.isRetryable()).toBe(true);

    const timeoutErr = DeliveryError.fromException(new Error('ETIMEDOUT connection timeout'));
    expect(timeoutErr.getCategory()).toBe(DeliveryErrorCategory.TIMEOUT);
    expect(timeoutErr.isRetryable()).toBe(true);
  });
});
