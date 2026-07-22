import {
  CircuitOpenError,
  BulkheadFullError,
  BackpressureError,
  TimeoutError,
} from '../../../../src/resilience/errors';

describe('Resilience Error Classes Unit Tests', () => {
  it('should construct CircuitOpenError with HTTP 503 status code and message', () => {
    const err = new CircuitOpenError('dest-123');
    expect(err.statusCode).toBe(503);
    expect(err.message).toBe('Circuit breaker open for destination dest-123');
    expect(err.name).toBe('CircuitOpenError');
  });

  it('should construct BulkheadFullError with HTTP 503 status code and message', () => {
    const err = new BulkheadFullError('WEBHOOK');
    expect(err.statusCode).toBe(503);
    expect(err.message).toBe('Bulkhead WEBHOOK at capacity');
  });

  it('should construct BackpressureError with HTTP 503 status code and message', () => {
    const err = new BackpressureError('Queue depth limit breached', 'CRITICAL');
    expect(err.statusCode).toBe(503);
    expect(err.message).toContain('System under backpressure');
  });

  it('should construct TimeoutError with HTTP 408 status code and message', () => {
    const err = new TimeoutError('HttpRequest', 5000);
    expect(err.statusCode).toBe(408);
    expect(err.message).toBe('Operation HttpRequest timed out after 5000ms');
  });
});
