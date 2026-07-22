/**
 * Tracing context passed along threads and network dispatches
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
}

/**
 * Standard key-value format for attaching attributes to OpenTelemetry spans
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined | string[] | number[] | boolean[];
}

/**
 * Structured tags applied when emitting Prometheus performance metrics
 */
export interface MetricLabels {
  [key: string]: string | number | undefined;
}
