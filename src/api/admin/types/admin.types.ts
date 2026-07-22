export interface QueueStats {
  totalJobs: number;
  pending: number;
  processing: number;
  delayed: number;
  dlq: number;
  throughput: number;
}

export interface DeliveryStats {
  total: number;
  completed: number;
  failed: number;
  retrying: number;
  pendingRetry: number;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  components: {
    database: boolean;
    redis: boolean;
    queue: boolean;
  };
}

export interface DashboardData {
  queueStats: QueueStats;
  deliveryStats: DeliveryStats;
  systemHealth: SystemHealth;
  recentErrors: any[];
  timestamp: string;
}

export interface DLQAnalysis {
  errorPatterns: Record<string, number>;
  topErrors: { error: string; count: number }[];
  timeline: { date: string; count: number }[];
}

export interface WorkerInfo {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAINING';
  activeJobs: number;
  concurrency: number;
  uptimeSeconds: number;
}

export interface DaemonInfo {
  id: string;
  name: string;
  status: 'RUNNING' | 'PAUSED' | 'IDLE';
  lastRunAt?: Date;
  isLeader: boolean;
}

export interface ComplianceReport {
  startDate: string;
  endDate: string;
  totalEvents: number;
  securityEventsCount: number;
  events: any[];
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  tier: string;
  rateLimit: number;
  quotaLimit: number;
  enabled: boolean;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
}

export interface ResourceUsage {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  totalMemoryMb: number;
  heapUsedMb: number;
}

export interface PerfMetrics {
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
}

export interface ExportJob {
  exportId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  format: 'JSON' | 'CSV' | 'PARQUET';
  downloadUrl?: string;
  createdAt: Date;
}
