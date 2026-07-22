import { trace, Span, SpanContext } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

/**
 * Provides OpenTelemetry trace inspection utilities for test assertions.
 * Installs an in-memory exporter and collects spans for validation.
 *
 * @example
 * ```typescript
 * const th = new TraceTestHelper();
 * th.install();
 * // ... run code under test ...
 * th.assertSpanCreated('DeliverTaskResult.execute');
 * th.uninstall();
 * ```
 */
export class TraceTestHelper {
  private readonly exporter: InMemorySpanExporter;
  private provider: NodeTracerProvider | null = null;

  constructor() {
    this.exporter = new InMemorySpanExporter();
  }

  /**
   * Installs the in-memory exporter as the active tracer provider.
   */
  public install(): void {
    this.provider = new NodeTracerProvider();
    this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
    this.provider.register();
  }

  /**
   * Unregisters the test tracer provider and resets span storage.
   */
  public uninstall(): void {
    this.exporter.reset();
    this.provider = null;
    // Restore the noop tracer provider
    trace.disable();
  }

  /**
   * Returns all recorded spans, optionally filtered by operation name.
   * @param operationName - Optional span name to filter by.
   */
  public getSpans(operationName?: string): ReturnType<InMemorySpanExporter['getFinishedSpans']> {
    const spans = this.exporter.getFinishedSpans();
    if (!operationName) return spans;
    return spans.filter((s) => s.name === operationName);
  }

  /**
   * Returns the trace ID of the most recently recorded span.
   * @throws {Error} if no spans have been recorded.
   */
  public getTraceId(): string {
    const spans = this.exporter.getFinishedSpans();
    if (spans.length === 0) {
      throw new Error('[TraceTestHelper] No spans recorded yet.');
    }
    const ctx: SpanContext = spans[spans.length - 1]!.spanContext();
    return ctx.traceId;
  }

  /**
   * Returns the attributes map of the named span.
   * @param spanName - Span operation name to look up.
   * @throws {Error} if the span is not found.
   */
  public getSpanAttributes(spanName: string): Record<string, unknown> {
    const span = this.exporter.getFinishedSpans().find((s) => s.name === spanName);
    if (!span) {
      throw new Error(
        `[TraceTestHelper] Span "${spanName}" not found. ` +
          `Recorded spans: [${this.exporter.getFinishedSpans().map((s) => s.name).join(', ')}].`
      );
    }
    return span.attributes as Record<string, unknown>;
  }

  /**
   * Asserts that a span with the given operation name was recorded.
   * @param operationName - Expected span name.
   */
  public assertSpanCreated(operationName: string): void {
    const spans = this.getSpans(operationName);
    if (spans.length === 0) {
      const names = this.exporter.getFinishedSpans().map((s) => s.name);
      throw new Error(
        `[TraceTestHelper] Span "${operationName}" was not created. ` +
          `Recorded spans: [${names.join(', ')}].`
      );
    }
  }

  /**
   * Asserts that a specific span has an attribute equal to the expected value.
   * @param spanName - Span operation name.
   * @param attributeName - Attribute key to check.
   * @param expectedValue - Expected attribute value.
   */
  public assertSpanAttribute(
    spanName: string,
    attributeName: string,
    expectedValue: unknown
  ): void {
    const attributes = this.getSpanAttributes(spanName);
    const actual = attributes[attributeName];
    if (actual !== expectedValue) {
      throw new Error(
        `[TraceTestHelper] Span "${spanName}" attribute "${attributeName}": ` +
          `expected "${String(expectedValue)}" but got "${String(actual)}".`
      );
    }
  }

  /**
   * Resets all recorded spans without uninstalling the provider.
   */
  public reset(): void {
    this.exporter.reset();
  }

  /**
   * Returns the total count of recorded spans.
   */
  public getSpanCount(): number {
    return this.exporter.getFinishedSpans().length;
  }
}
