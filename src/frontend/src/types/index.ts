export interface TaskResult {
  id: string;
  emailId: string;
  agentId: string;
  agentVersion?: string;
  confidenceScore?: number;
  resultPayload?: Record<string, any>;
  status: 'COMPLETED' | 'FAILED_DLQ' | 'PENDING' | 'PROCESSING';
  createdAt: string;
  updatedAt: string;
}

export interface TaskDelivery {
  id: string;
  taskResultId: string;
  emailId?: string;
  destinationId: string;
  destinationName?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'SCHEDULED_RETRY' | 'FAILED_DLQ';
  attemptCount: number;
  retryCount?: number;
  lastError?: string;
  errorCategory?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  nextRetryAt?: string;
  attempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  id: string;
  deliveryId: string;
  attemptNumber: number;
  responseStatus?: number;
  responseTimeMs: number;
  errorMessage?: string;
  timestamp: string;
}

export interface SystemHealth {
  totalJobsProcessed: number;
  successRate: number;
  failedJobs: number;
  queueDepth: number;
  activeWorkers: number;
  systemStatus: 'healthy' | 'degraded' | 'offline';
  uptimePercent?: number;
  activeIncidents?: number;
  lastUpdated: string;
  checks?: {
    database?: { status: string; latencyMs?: number };
    redis?: { status: string; latencyMs?: number };
    queue?: { status: string; size?: number };
  };
}

export interface Worker {
  id: string;
  hostname?: string;
  status: 'online' | 'offline';
  lastHeartbeat: string;
  processingCount: number;
  currentJob?: string;
  uptime: number;
  concurrency?: number;
}

export interface DLQItem {
  id: string;
  deliveryId: string;
  taskResultId: string;
  emailId: string;
  reason: string;
  errorCategory?: string;
  errorStack?: string;
  retryCount: number;
  createdAt: string;
  lastAttemptAt: string;
}

export interface JobTimeSeriesPoint {
  timestamp: string;
  completed: number;
  failed: number;
  pending: number;
}
