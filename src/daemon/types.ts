import { DaemonStatus } from './base-daemon';
import { DependencyStatus, HealthStatusDetail } from './health/dependency-checker';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'healthy' | 'degraded' | 'unhealthy' | any;

export { DaemonStatus, DependencyStatus, HealthStatusDetail };

export interface WorkerStats {
  active?: number;
  stale?: number;
  workerId?: string;
  [key: string]: any;
}

/**
 * Diagnostic health status details of primary dependencies and workers.
 */
export interface HealthCheckResult {
  timestamp: Date;
  database: HealthStatus;
  redis: HealthStatus;
  queue: HealthStatus;
  workers: {
    active: number;
    stale: number;
  };
  overall: HealthStatus;
}

/**
 * Detailed system health status with description of logged issues.
 */
export interface SystemHealthStatus {
  status: HealthStatus;
  checks: Record<string, HealthStatus>;
  timestamp: Date;
  issues: string[];
}

/**
 * Custom queue tracking metrics including queue depth and rate summaries.
 */
export interface QueueMetrics {
  depth: {
    main: number;
    delayed: number;
    dlq: number;
  };
  throughput: number;
  successRate: number;
  avgLatency: number;
}

/**
 * Custom transactional delivery metrics.
 */
export interface DeliveryMetrics {
  successRate: number;
  failureRate: number;
  dlqRate: number;
  avgRetries: number;
  avgLatency: number;
  byDestinationType: Record<string, {
    successRate: number;
    failureRate: number;
    dlqRate: number;
    avgRetries: number;
    avgLatency: number;
    count: number;
  }>;
}

/**
 * Represents the current status and metrics of a daemon subsystem.
 */
export interface SubsystemDaemonStatus {
  name: string;
  running: boolean;
  lastRun: Date | null;
  durationMs: number;
  errorCount: number;
}
