import { ObservabilityConfig } from '../../config/observability';

/**
 * Interface mapping tracing configs properties.
 */
export interface TraceConfig {
  enabled: boolean;
  serviceName: string;
  endpoint: string;
  sampleRate: number;
}

/**
 * Validates and transforms the observability config into standard tracing configurations.
 * @param config - Observability configuration properties
 */
export function getTraceConfig(config: ObservabilityConfig): TraceConfig {
  const sampleRate = config.traceSampleRate;
  if (sampleRate < 0 || sampleRate > 1) {
    throw new Error('traceSampleRate must be a float between 0.0 and 1.0');
  }

  return {
    enabled: config.tracingEnabled,
    serviceName: config.jaegerServiceName || 'queueforge',
    endpoint: config.jaegerEndpoint || 'http://localhost:4318/v1/traces',
    sampleRate,
  };
}
