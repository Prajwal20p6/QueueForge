import { RetryAttempt } from '../../../../src/domain/value-objects/retry-attempt.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('RetryAttempt Value Object Unit Tests', () => {
  it('should instantiate valid RetryAttempt records and evaluate success', () => {
    const attempt = RetryAttempt.create(1, 200, null, 150);
    expect(attempt.getNumber()).toBe(1);
    expect(attempt.getStatusCode()).toBe(200);
    expect(attempt.getError()).toBeNull();
    expect(attempt.getLatency()).toBe(150);
    expect(attempt.wasSuccessful()).toBe(true);

    const failedAttempt = RetryAttempt.create(2, 500, 'Internal Server Error', 300);
    expect(failedAttempt.wasSuccessful()).toBe(false);
  });

  it('should throw ValidationError on non-positive attempt number', () => {
    expect(() => RetryAttempt.create(0)).toThrow(ValidationError);
  });
});
