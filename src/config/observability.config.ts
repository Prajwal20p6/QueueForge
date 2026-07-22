import { z } from 'zod';
import { EnvLoader } from './env';

import { LogLevel } from '../shared/constants/app.constants';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * ObservabilityConfig interface representing tracing, metrics, logging and audit settings
 */
export interface ObservabilityConfig {
  readonly tracing: {
    readonly enabled: boolean;
    readonly sampleRate: number;
    readonly exportInterval: number;
    readonly otlpEndpoint: string;
    readonly serviceName: string;
    readonly serviceVersion: string;
    readonly environment: string;
  };
  readonly metrics: {
    readonly enabled: boolean;
    readonly exportInterval: number;
    readonly prometheusPort: number;
    readonly enableDefaultMetrics: boolean;
  };
  readonly logging: {
    readonly level: LogLevel;
    readonly format: 'json' | 'text';
    readonly enableFileOutput: boolean;
    readonly logDirectory: string;
    readonly maxFileSize: number;
    readonly maxFiles: number;
  };
  readonly audit: {
    readonly enabled: boolean;
    readonly storageType: 'database' | 'elasticsearch';
    readonly retentionDays: number;
  };

  // Backward compatibility fields
  readonly serviceName: string;
  readonly serviceVersion: string;
  readonly jaegerEndpoint: string;
  readonly traceSampleRate: number;
  readonly prometheusPort: number;
  readonly enableAuditLogging: boolean;
  readonly auditLogRetentionDays: number;
  readonly logLevel: LogLevel | string;
  readonly loggingEnabled: boolean;
  readonly jaegerServiceName: string;
  readonly metricsEnabled: boolean;
  readonly tracingEnabled: boolean;
  readonly enabled?: boolean;
  readonly logFormat?: string;
  readonly logDestination?: string;
  readonly metricBuckets?: any[];
}

const observabilityConfigSchema = z.object({
  tracing: z.object({
    enabled: z.boolean(),
    sampleRate: z.number().min(0, "OTEL_TRACE_SAMPLE_RATE must be between 0.0 and 1.0").max(1, "OTEL_TRACE_SAMPLE_RATE must be between 0.0 and 1.0"),
    exportInterval: z.number().int().positive(),
    otlpEndpoint: z.string().url(),
    serviceName: z.string().min(1),
    serviceVersion: z.string().min(1),
    environment: z.string().min(1),
  }),
  metrics: z.object({
    enabled: z.boolean(),
    exportInterval: z.number().int().positive(),
    prometheusPort: z.number().int().min(1, "PROMETHEUS_PORT must be between 1 and 65535").max(65535, "PROMETHEUS_PORT must be between 1 and 65535"),
    enableDefaultMetrics: z.boolean(),
  }),
  logging: z.object({
    level: z.nativeEnum(LogLevel).or(z.string()),
    format: z.enum(['json', 'text']),
    enableFileOutput: z.boolean(),
    logDirectory: z.string().min(1),
    maxFileSize: z.number().int().positive(),
    maxFiles: z.number().int().positive(),
  }),
  audit: z.object({
    enabled: z.boolean(),
    storageType: z.enum(['database', 'elasticsearch']),
    retentionDays: z.number().int().positive(),
  }),
  serviceName: z.string().min(1),
  serviceVersion: z.string().min(1),
  jaegerEndpoint: z.string().url(),
  traceSampleRate: z.number().min(0, "OTEL_TRACE_SAMPLE_RATE must be between 0.0 and 1.0").max(1, "OTEL_TRACE_SAMPLE_RATE must be between 0.0 and 1.0"),
  prometheusPort: z.number().int().min(1, "PROMETHEUS_PORT must be between 1 and 65535").max(65535, "PROMETHEUS_PORT must be between 1 and 65535"),
  enableAuditLogging: z.boolean(),
  auditLogRetentionDays: z.number().int().positive(),
  logLevel: z.nativeEnum(LogLevel).or(z.string()),
  loggingEnabled: z.boolean(),
  jaegerServiceName: z.string().min(1),
  metricsEnabled: z.boolean(),
  tracingEnabled: z.boolean(),
  enabled: z.boolean().optional(),
  logFormat: z.string().optional(),
  logDestination: z.string().optional(),
  metricBuckets: z.array(z.any()).optional(),
});

/**
 * Loads and validates the ObservabilityConfig
 */
export function loadObservabilityConfig(envOverride?: any): ObservabilityConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProd = nodeEnv === 'production';
  const envName = nodeEnv;
  const envSampleRate = process.env.OTEL_TRACE_SAMPLE_RATE ? Number(process.env.OTEL_TRACE_SAMPLE_RATE) : undefined;
  const sampleRate = envSampleRate !== undefined ? envSampleRate : (isProd ? 0.1 : 1.0);

  // Pre-schema validations with clear messages
  if (sampleRate < 0 || sampleRate > 1) {
    throw new ValidationError('OTEL_TRACE_SAMPLE_RATE must be between 0.0 and 1.0');
  }

  const tracePort = Number(EnvLoader.getOrDefault('PROMETHEUS_PORT', '9090'));
  if (tracePort < 1 || tracePort > 65535) {
    throw new ValidationError('PROMETHEUS_PORT must be between 1 and 65535');
  }
  
  const logLevelStr = EnvLoader.getOrDefault('LOG_LEVEL', 'info').toLowerCase();
  let level = LogLevel.INFO;
  if (logLevelStr === 'debug') level = LogLevel.DEBUG;
  else if (logLevelStr === 'warn') level = LogLevel.WARN;
  else if (logLevelStr === 'error') level = LogLevel.ERROR;

  const data = {
    tracing: {
      enabled: true,
      sampleRate,
      exportInterval: 30000,
      otlpEndpoint: EnvLoader.getOrDefault('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4317'),
      serviceName: 'queueforge',
      serviceVersion: '1.0.0',
      environment: envName,
    },
    metrics: {
      enabled: true,
      exportInterval: 60000,
      prometheusPort: tracePort,
      enableDefaultMetrics: true,
    },
    logging: {
      level,
      format: isProd ? ('json' as const) : ('text' as const),
      enableFileOutput: isProd,
      logDirectory: './logs',
      maxFileSize: 10485760, // 10MB
      maxFiles: 10,
    },
    audit: {
      enabled: true,
      storageType: 'database' as const,
      retentionDays: 90,
    },
    serviceName: EnvLoader.getOrDefault('APP_NAME', 'queueforge'),
    serviceVersion: '1.0.0',
    jaegerEndpoint: EnvLoader.getOrDefault('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces'),
    traceSampleRate: sampleRate,
    prometheusPort: tracePort,
    enableAuditLogging: true,
    auditLogRetentionDays: 90,
    logLevel: level,
    loggingEnabled: true,
    jaegerServiceName: EnvLoader.getOrDefault('APP_NAME', 'queueforge'),
    metricsEnabled: true,
    tracingEnabled: true,
    enabled: true,
    logFormat: isProd ? 'json' : 'pretty',
    logDestination: 'console',
    metricBuckets: [],
  };

  const parsed = observabilityConfigSchema.safeParse(data);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Invalid ObservabilityConfig settings structure: ${errorDetails}`, parsed.error.errors);
  }

  return Object.freeze(parsed.data) as ObservabilityConfig;
}
export { loadObservabilityConfig as getObservabilityConfig };
export { ObservabilityConfig as ObservabilitySettings };
