/**
 * Configuration variables for retention, sampling, and anomaly parameters.
 */
export const observabilityConfig = {
  samplingRate: parseFloat(process.env.OTEL_TRACING_SAMPLING_RATE ?? '1.0'),
  retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS ?? '30', 10),
  evalIntervalMs: parseInt(process.env.SLO_EVALUATION_INTERVAL_MS ?? '300000', 10),
  anomalyThresholdZScore: 3.0,
};
