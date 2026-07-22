import { Tracer } from '../src/observability/tracing/tracer';
import { Span } from '@opentelemetry/api';

/**
 * Enhanced tracer wrapping open telemetry trace context instrumentation blocks.
 */
export class EnhancedTracer {
  private readonly baseTracer: Tracer;

  constructor(baseTracer: Tracer) {
    this.baseTracer = baseTracer;
  }

  /**
   * Generates spanned telemetry scopes attaching specific transaction keys.
   */
  public createContextualSpan(
    operationName: string,
    metadata: { userId?: string; emailId?: string; resultId?: string }
  ): Span {
    const tracer = this.baseTracer.getTracer();
    const span = tracer.startSpan(operationName);

    if (metadata.userId) span.setAttribute('user.id', metadata.userId);
    if (metadata.emailId) span.setAttribute('email.id', metadata.emailId);
    if (metadata.resultId) span.setAttribute('result.id', metadata.resultId);

    return span;
  }
}
