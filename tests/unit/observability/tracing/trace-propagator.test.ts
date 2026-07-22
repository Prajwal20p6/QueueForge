import { TracePropagator } from '../../../../src/observability/tracing/trace-propagator';
import { context } from '@opentelemetry/api';

describe('TracePropagator Unit Tests', () => {
  let propagator: TracePropagator;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    propagator = new TracePropagator(logger);
  });

  it('should inject active context into headers successfully', () => {
    const headers = propagator.inject(context.active());
    expect(headers).toBeDefined();
  });

  it('should extract trace context from valid headers map', () => {
    const mockHeaders = {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    };
    const ctx = propagator.extract(mockHeaders);
    expect(ctx).toBeDefined();
  });
});
