import { Span as OtelSpan, trace, context as otelContext, Context, SpanStatusCode } from '@opentelemetry/api';
import { Span } from '../types';

/**
 * Custom wrapper class implementing the telemetry Span interface delegating to OTel.
 */
export class SpanWrapper implements Span {
  private readonly otelSpan: OtelSpan;

  constructor(otelSpan: OtelSpan) {
    this.otelSpan = otelSpan;
  }

  public spanContext() {
    return this.otelSpan.spanContext();
  }

  public setAttribute(key: string, value: any): this {
    this.otelSpan.setAttribute(key, value);
    return this;
  }

  public setAttributes(attributes: Record<string, any>): this {
    this.otelSpan.setAttributes(attributes);
    return this;
  }

  public addEvent(name: string, attributes?: Record<string, any>): this {
    this.otelSpan.addEvent(name, attributes);
    return this;
  }

  public recordException(exception: Error, time?: any): this {
    if (typeof this.otelSpan.recordException === 'function') {
      this.otelSpan.recordException(exception, time);
    }
    return this;
  }

  public setStatus(status: any): this {
    this.otelSpan.setStatus(status);
    return this;
  }

  public updateName(name: string): this {
    this.otelSpan.updateName(name);
    return this;
  }

  public end(endTime?: any): void {
    this.otelSpan.end(endTime);
  }

  public isRecording(): boolean {
    return this.otelSpan.isRecording();
  }

  public addLink(link: any): this {
    if (typeof (this.otelSpan as any).addLink === 'function') {
      (this.otelSpan as any).addLink(link);
    }
    return this;
  }

  public addLinks(links: any[]): this {
    if (typeof (this.otelSpan as any).addLinks === 'function') {
      (this.otelSpan as any).addLinks(links);
    }
    return this;
  }

  public addAttribute(key: string, value: any): this {
    this.otelSpan.setAttribute(key, value);
    return this;
  }
}

/**
 * Factory orchestrating trace span creations, hierarchies, and contexts.
 */
export class SpanFactory {
  private readonly tracer: any;
  private readonly logger?: any;

  constructor(tracer: any, logger?: any) {
    this.tracer = tracer;
    this.logger = logger;
  }

  /**
   * Helper extracting standard telemetry attributes.
   */
  private getStandardAttributes(): Record<string, any> {
    return {
      'service.name': 'queueforge',
      'service.version': '1.0.0',
      'environment': process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Instance method creating a active trace span.
   */
  public createSpan(name: string, attributes?: Record<string, any>): Span {
    this.logger?.debug?.(`Starting span: "${name}"`);
    const otelSpan = this.tracer?.startSpan ? this.tracer.startSpan(name, {
      attributes: {
        ...this.getStandardAttributes(),
        ...attributes,
      },
    }) : trace.getTracer('queueforge').startSpan(name, { attributes });

    return new SpanWrapper(otelSpan);
  }

  /**
   * Instance method creating a child trace span under parentSpan hierarchy.
   */
  public createChildSpan(parentSpan: Span, name: string, attributes?: Record<string, any>): Span {
    this.logger?.debug?.(`Starting child span: "${name}" under parent trace`);
    const parentCtx = trace.setSpan(otelContext.active(), parentSpan as any);
    const otelSpan = this.tracer?.startSpan ? this.tracer.startSpan(
      name,
      {
        attributes: {
          ...this.getStandardAttributes(),
          ...attributes,
        },
      },
      parentCtx
    ) : trace.getTracer('queueforge').startSpan(name, { attributes }, parentCtx);

    return new SpanWrapper(otelSpan);
  }

  /**
   * Static helper creating a trace span using active OpenTelemetry tracer.
   */
  public static createSpan(name: string, attributes?: Record<string, any>): Span {
    const otelSpan = trace.getTracer('queueforge').startSpan(name, { attributes });
    return new SpanWrapper(otelSpan);
  }

  /**
   * Static helper creating a child trace span.
   */
  public static createChildSpan(parentSpan: any, name: string, attributes?: Record<string, any>): Span {
    const parentCtx = trace.setSpan(otelContext.active(), parentSpan);
    const otelSpan = trace.getTracer('queueforge').startSpan(name, { attributes }, parentCtx);
    return new SpanWrapper(otelSpan);
  }

  /**
   * Static helper ending a span with optional status and exception recording.
   */
  public static endSpan(span: any, status?: any, error?: Error): void {
    if (!span) return;
    if (error && typeof span.recordException === 'function') {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    } else if (status && typeof span.setStatus === 'function') {
      span.setStatus(status);
    }
    if (typeof span.end === 'function') {
      span.end();
    }
  }

  public createSpanFromContext(parentContext: Context, name: string, attributes?: Record<string, any>): Span {
    this.logger?.debug?.(`Starting span: "${name}" from propagated context`);
    const otelSpan = this.tracer?.startSpan ? this.tracer.startSpan(
      name,
      {
        attributes: {
          ...this.getStandardAttributes(),
          ...attributes,
        },
      },
      parentContext
    ) : trace.getTracer('queueforge').startSpan(name, { attributes }, parentContext);

    return new SpanWrapper(otelSpan);
  }
}

export { Span };
