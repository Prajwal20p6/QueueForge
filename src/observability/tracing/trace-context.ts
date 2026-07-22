import { trace, context, Context, propagation } from '@opentelemetry/api';

/**
 * Immutable TraceContext holding metadata representing active tracing credentials and context propagation.
 */
export class TraceContext {
  public readonly traceId: string;
  public readonly spanId: string;
  public readonly parentSpanId: string | null;
  public readonly traceFlags: number;
  public readonly baggage: Record<string, string>;
  public readonly remote: boolean;

  constructor(
    traceId: string,
    spanId: string,
    parentSpanId: string | null = null,
    traceFlagsOrBaggage: number | Record<string, string> = 1,
    baggage: Record<string, string> = {}
  ) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
    if (typeof traceFlagsOrBaggage === 'number') {
      this.traceFlags = traceFlagsOrBaggage;
      this.baggage = baggage;
    } else {
      this.traceFlags = 1;
      this.baggage = traceFlagsOrBaggage;
    }
    this.remote = false;
  }

  public getTraceId(): string {
    return this.traceId;
  }

  public getSpanId(): string {
    return this.spanId;
  }

  public getParentSpanId(): string | null {
    return this.parentSpanId;
  }

  public isRemote(): boolean {
    return this.remote;
  }

  public toJSON(): Record<string, string> {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId || '',
      traceFlags: String(this.traceFlags),
    };
  }

  /**
   * Builds TraceContext instance from the current active context or custom context argument.
   */
  public static fromContext(ctx: Context = context.active()): TraceContext {
    const span = trace.getSpan(ctx);
    const spanContext = span?.spanContext();

    const traceId = spanContext?.traceId || '';
    const spanId = spanContext?.spanId || '';
    const traceFlags = spanContext?.traceFlags || 1;

    const baggageEntries: Record<string, string> = {};
    const otelBaggage = propagation.getBaggage(ctx);
    if (otelBaggage) {
      otelBaggage.getAllEntries().forEach(([key, entry]) => {
        baggageEntries[key] = entry.value;
      });
    }

    return new TraceContext(traceId, spanId, null, traceFlags, baggageEntries);
  }

  /**
   * Serializes context credentials into W3C compliant key-value headers.
   */
  public toHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const ctx = this.propagate();
    propagation.inject(ctx, headers);
    return headers;
  }

  /**
   * Prepares context with the current traceId/spanId mapping for propagation.
   */
  public propagate(): Context {
    let ctx = context.active();

    if (this.traceId && this.spanId) {
      const spanContext = {
        traceId: this.traceId,
        spanId: this.spanId,
        traceFlags: this.traceFlags,
        isRemote: true,
      };
      ctx = trace.setSpanContext(ctx, spanContext);
    }

    return ctx;
  }
}
