import { LogContext } from '../../../../src/observability/logging/log-context';
import { Request } from 'express';

describe('LogContext Unit Tests', () => {
  it('should construct, append properties and output correct values to JSON', () => {
    const context = new LogContext('trace-99', 'span-88', 'user-77', 'tenant-66', 'req-55', {
      customData: 'myData',
    });

    expect(context.traceId).toBe('trace-99');
    expect(context.spanId).toBe('span-88');
    expect(context.userId).toBe('user-77');
    expect(context.tenantId).toBe('tenant-66');
    expect(context.requestId).toBe('req-55');

    const extended = context.with({ extra: 'val' });
    const json = extended.toJSON();

    expect(json.traceId).toBe('trace-99');
    expect(json.extra).toBe('val');
    expect(json.customData).toBe('myData');
  });

  it('should safely extract fields from Express requests', () => {
    const mockRequest = {
      headers: {
        'x-request-id': 'mock-req-id',
        'x-tenant-id': 'mock-tenant-id',
      },
      credentials: {
        subject: 'mock-user-id',
      },
    } as any as Request;

    const context = LogContext.fromRequest(mockRequest);
    expect(context.requestId).toBe('mock-req-id');
    expect(context.tenantId).toBe('mock-tenant-id');
    expect(context.userId).toBe('mock-user-id');
  });
});
