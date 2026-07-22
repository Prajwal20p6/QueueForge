import { TraceContext } from '../../../../src/observability/tracing/trace-context';

describe('TraceContext Unit Tests', () => {
  it('should construct context fields and serialize to standard headers', () => {
    const context = new TraceContext('trace-1234', 'span-5678', null, { user: 'test-user' });
    expect(context.traceId).toBe('trace-1234');
    expect(context.spanId).toBe('span-5678');
    expect(context.baggage.user).toBe('test-user');

    const headers = context.toHeaders();
    expect(headers).toBeDefined();
  });

  it('should create context instances from current active context', () => {
    const traceCtx = TraceContext.fromContext();
    expect(traceCtx).toBeDefined();
    expect(traceCtx.traceId).toBe('');
  });
});
