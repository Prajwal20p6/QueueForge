import { Logger } from '../logging/logger';
import { MetricsRegistry } from '../metrics/metrics-registry';
import { TraceContext } from '../tracing/trace-context';
import { LogContext } from '../logging/log-context';
import { AuditLogger } from '../audit/audit-logger';

/**
 * Composite ObservabilityContext container grouping Tracer, MetricsRegistry, Logger, AuditLogger, and contexts.
 */
export interface ObservabilityContext {
  tracer: any;
  metricsRegistry: MetricsRegistry;
  logger: Logger;
  auditLogger: AuditLogger;
  metrics: MetricsRegistry;
  audit: AuditLogger;
  traceContext?: TraceContext;
  logContext?: LogContext;
}
