export * from './tracing';
export * from './metrics';
export * from './logging';
export * from './audit';
export * from './context';
export * from './health';
export * from './observability.module';

import { Logger } from './logging/logger';
import { Tracer } from './tracing/tracer';
import { MetricsRegistry } from './metrics/metrics-registry';
import { AuditLogger } from './audit/audit-logger';
import { getObservability } from './observability.module';

export const observability: any = {
  get logger() {
    return getObservability().logger;
  },
  get tracer() {
    return getObservability().tracer;
  },
  get metrics() {
    return getObservability().metrics;
  },
  get audit() {
    return getObservability().audit;
  },
};

export function createLogger(config?: any, name = 'queueforge'): Logger {
  return new Logger(config, name);
}

export function createTracer(config?: any, logger?: any): Tracer {
  return new Tracer(config, logger);
}

export function createMetricsRegistry(config?: any, logger?: any): MetricsRegistry {
  return new MetricsRegistry(config, logger);
}

export function createAuditLogger(
  logger: any,
  repository?: any,
  metricsRegistry?: any
): AuditLogger {
  return new AuditLogger(logger, repository, metricsRegistry);
}
