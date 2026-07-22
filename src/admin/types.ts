export interface DashboardOverview {
  systemStatus: string;
  uptimePercent: number;
  activeIncidents: number;
  totalJobsProcessed: number;
}

export interface QueueStatistics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface DeliveryStatistics {
  successRatePercent: number;
  totalAttempts: number;
  latencyAvgMs: number;
}

export interface WorkerStatistics {
  activeCount: number;
  idleCount: number;
}

export interface SystemHealthStatus {
  database: string;
  redis: string;
}

export interface ConfigurationSummary {
  version: string;
  updatedAt: Date;
  env: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  active: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  timestamp: Date;
}

export interface AdminAlert {
  id: string;
  ruleId: string;
  status: string;
  triggeredAt: Date;
}
