import { HttpStatusCode } from '../../../../src/domain/value-objects/http-status-code';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('HttpStatusCode Value Object Unit Tests', () => {
  it('should successfully create a valid HttpStatusCode', () => {
    const status = HttpStatusCode.create(200);
    expect(status.getCode()).toBe(200);
    expect(status.toString()).toBe('200');
  });

  it('should throw ValidationError on out-of-bounds HTTP code ranges', () => {
    expect(() => HttpStatusCode.create(99)).toThrow(ValidationError);
    expect(() => HttpStatusCode.create(600)).toThrow(ValidationError);
  });

  it('should classify HTTP status ranges correctly', () => {
    const success = HttpStatusCode.create(201);
    expect(success.isSuccess()).toBe(true);
    expect(success.isClientError()).toBe(false);
    expect(success.isServerError()).toBe(false);

    const clientError = HttpStatusCode.create(404);
    expect(clientError.isSuccess()).toBe(false);
    expect(clientError.isClientError()).toBe(true);
    expect(clientError.isServerError()).toBe(false);

    const serverError = HttpStatusCode.create(503);
    expect(serverError.isSuccess()).toBe(false);
    expect(serverError.isClientError()).toBe(false);
    expect(serverError.isServerError()).toBe(true);
  });

  it('should correctly determine retryable statuses', () => {
    const gatewayTimeout = HttpStatusCode.create(504);
    expect(gatewayTimeout.isRetryable()).toBe(true);

    const rateLimit = HttpStatusCode.create(429);
    expect(rateLimit.isRetryable()).toBe(true);

    const badRequest = HttpStatusCode.create(400);
    expect(badRequest.isRetryable()).toBe(false);
  });

  it('should correctly determine permanent client error statuses', () => {
    const permanentCodes = [400, 401, 403, 404, 422];
    permanentCodes.forEach(code => {
      const status = HttpStatusCode.create(code);
      expect(status.isPermanentError()).toBe(true);
    });

    const otherClientError = HttpStatusCode.create(409); // Conflict - not marked permanent
    expect(otherClientError.isPermanentError()).toBe(false);
  });

  it('should evaluate value equality correctly', () => {
    const status1 = HttpStatusCode.create(200);
    const status2 = HttpStatusCode.create(200);
    const status3 = HttpStatusCode.create(301);

    expect(status1.equals(status2)).toBe(true);
    expect(status1.equals(status3)).toBe(false);
  });
});
