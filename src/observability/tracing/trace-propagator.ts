import { context, Context, propagation } from '@opentelemetry/api';
import { TraceContext } from './trace-context';
import { Logger } from '../logging/logger';

/**
 * Propagator managing W3C trace contexts and baggage injection/extraction.
 */
export class TracePropagator {
  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Static helper injecting W3C traceparent header.
   */
  public static inject(traceContext: TraceContext | any, headers: Record<string, string>): void {
    if (!traceContext || !headers) return;
    const traceId = traceContext.traceId || traceContext.getTraceId?.() || '';
    const spanId = traceContext.spanId || traceContext.getSpanId?.() || '';
    const flags = (traceContext.traceFlags ?? 1).toString(16).padStart(2, '0');

    if (traceId && spanId) {
      headers['traceparent'] = `00-${traceId}-${spanId}-${flags}`;
    }
  }

  /**
   * Static helper extracting W3C traceparent header into a TraceContext.
   */
  public static extract(headers: Record<string, string>): TraceContext | null {
    if (!headers) return null;
    const traceparent = headers['traceparent'] || headers['Traceparent'];
    if (!traceparent || typeof traceparent !== 'string') return null;

    const parts = traceparent.split('-');
    if (parts.length < 4) return null;

    const [, traceId, spanId, flagsStr] = parts;
    const flags = parseInt(flagsStr || '01', 16);

    return new TraceContext(traceId, spanId, null, flags);
  }

  /**
   * Instance method extracting W3C trace context and baggage values from headers into a telemetry Context.
   */
  public extract(headers: Record<string, string>): Context {
    try {
      this.logger?.debug?.('Extracting trace context from incoming headers');
      return propagation.extract(context.active(), headers);
    } catch (err: any) {
      this.logger?.warn?.('Failed to extract trace context, returning active context instead', err);
      return context.active();
    }
  }

  /**
   * Instance method injecting the active telemetry context into headers map.
   */
  public inject(ctx: Context): Record<string, string> {
    try {
      this.logger?.debug?.('Injecting trace context into headers');
      const headers: Record<string, string> = {};
      propagation.inject(ctx, headers);
      return headers;
    } catch (err: any) {
      this.logger?.warn?.('Failed to inject trace context', err);
      return {};
    }
  }
}

export { Context };
