import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { logger } from '../logging/logger';

const otelServiceName = process.env.OTEL_SERVICE_NAME || 'queueforge-pipeline';
const otelExporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

export const otelSDK = new NodeSDK({
  serviceName: otelServiceName,
  traceExporter: new OTLPTraceExporter({
    url: `${otelExporterEndpoint}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Avoid logging spam for standard local file read/write operations
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
    }),
  ],
});

export function startOpenTelemetry(): void {
  try {
    otelSDK.start();
    logger.info('OpenTelemetry SDK initialized and running');
  } catch (err: any) {
    logger.error('Failed to initialize OpenTelemetry SDK', err);
  }
}
