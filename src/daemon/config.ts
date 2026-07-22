import { AppConfig } from '../config/app';

/**
 * Configuration options regulating daemon poll rates and warning threshold limits.
 */
export interface DaemonConfig {
  recoveryIntervalMs: number;
  stateSyncIntervalMs: number;
  dlqMonitorIntervalMs: number;
  healthCheckIntervalMs: number;
  metricsCollectionIntervalMs: number;
  deliveryMetricsIntervalMs: number;
  dlqThreshold: number;
  minActiveWorkers: number;
}

/**
 * Builds the DaemonConfig, applying environment variables overrides where specified.
 */
export function getDaemonConfig(_config?: AppConfig): DaemonConfig {
  return {
    recoveryIntervalMs: parseInt(process.env.DAEMON_RECOVERY_INTERVAL_MS || '10000', 10),
    stateSyncIntervalMs: parseInt(process.env.DAEMON_STATE_SYNC_INTERVAL_MS || '60000', 10),
    dlqMonitorIntervalMs: parseInt(process.env.DAEMON_DLQ_MONITOR_INTERVAL_MS || '30000', 10),
    healthCheckIntervalMs: parseInt(process.env.DAEMON_HEALTH_CHECK_INTERVAL_MS || '30000', 10),
    metricsCollectionIntervalMs: parseInt(process.env.DAEMON_METRICS_INTERVAL_MS || '10000', 10),
    deliveryMetricsIntervalMs: parseInt(process.env.DAEMON_DELIVERY_METRICS_INTERVAL_MS || '60000', 10),
    dlqThreshold: parseInt(process.env.DAEMON_DLQ_THRESHOLD || '10000', 10),
    minActiveWorkers: parseInt(process.env.DAEMON_MIN_ACTIVE_WORKERS || '1', 10),
  };
}
