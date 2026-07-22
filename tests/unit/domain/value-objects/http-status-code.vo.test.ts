import { HttpStatusCode } from '../../../../src/domain/value-objects/http-status-code.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('HttpStatusCode Value Object Unit Tests', () => {
  it('should categorize HTTP response codes correctly', () => {
    const ok = HttpStatusCode.create(200);
    expect(ok.isSuccess()).toBe(true);
    expect(ok.isRetryable()).toBe(false);

    const badReq = HttpStatusCode.create(400);
    expect(badReq.isClientError()).toBe(true);
    expect(badReq.isPermanentFailure()).toBe(true);
    expect(badReq.isRetryable()).toBe(false);

    const timeout = HttpStatusCode.create(408);
    expect(timeout.isClientError()).toBe(true);
    expect(timeout.isRetryable()).toBe(true);
    expect(timeout.isPermanentFailure()).toBe(false);

    const tooMany = HttpStatusCode.create(429);
    expect(tooMany.isRetryable()).toBe(true);
    expect(tooMany.isPermanentFailure()).toBe(false);

    const serverErr = HttpStatusCode.create(503);
    expect(serverErr.isServerError()).toBe(true);
    expect(serverErr.isRetryable()).toBe(true);
  });

  it('should throw ValidationError on out-of-bounds HTTP status codes', () => {
    expect(() => HttpStatusCode.create(99)).toThrow(ValidationError);
    expect(() => HttpStatusCode.create(600)).toThrow(ValidationError);
    expect(() => HttpStatusCode.create(200.5)).toThrow(ValidationError);
  });
});
