import { SpanFactory } from '../../../../src/observability/tracing/span-factory';
import { trace } from '@opentelemetry/api';

describe('SpanFactory Unit Tests', () => {
  let factory: SpanFactory;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    const otelTracer = trace.getTracer('test-tracer');
    factory = new SpanFactory(otelTracer, logger);
  });

  it('should successfully create and end span wrappers with attributes', () => {
    const span = factory.createSpan('test-operation', { customKey: 'customVal' });
    expect(span).toBeDefined();

    span.addAttribute('extraKey', 'extraVal');
    span.addEvent('test-event', { detail: 'eventDetail' });
    span.recordException(new Error('test exception'));

    expect(() => span.end()).not.toThrow();
  });

  it('should successfully create child spans nested under parent spans', () => {
    const parentSpan = factory.createSpan('parent-operation');
    const childSpan = factory.createChildSpan(parentSpan, 'child-operation');
    expect(childSpan).toBeDefined();

    childSpan.end();
    parentSpan.end();
  });
});
