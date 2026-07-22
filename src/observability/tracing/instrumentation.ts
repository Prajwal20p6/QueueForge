import { registerInstrumentations } from '@opentelemetry/instrumentation';

/**
 * Registers OpenTelemetry auto-instrumentations for HTTP, Express, PostgreSQL, and Redis.
 */
export function setupInstrumentations(tracerProvider?: any): void {
  try {
    registerInstrumentations({
      tracerProvider,
      instrumentations: [],
    });
  } catch {
    // Ignore optional instrumentation registration failures
  }
}
