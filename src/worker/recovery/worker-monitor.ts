export interface WorkerStatus {
  workerId: string;
  alive: boolean;
  jobsProcessed: number;
  jobsFailed: number;
  uptime: number;
}

export interface WorkerHealthStatus {
  healthy: boolean;
  checks: Record<string, boolean>;
}

/**
 * Health check monitor evaluating worker status, job throughput, and active connection leases.
 */
export class WorkerMonitor {
  private readonly startTime = Date.now();

  constructor(
    private readonly jobProcessor: any,
    private readonly heartbeat?: any,
    _logger?: any
  ) {}

  public async getStatus(): Promise<WorkerStatus> {
    const stats = this.jobProcessor?.getStats?.() || { jobsProcessed: 0, jobsFailed: 0 };
    const workerId = this.heartbeat?.workerId || 'worker-local';
    const alive = this.heartbeat ? await this.heartbeat.isAlive(workerId) : true;

    return {
      workerId,
      alive,
      jobsProcessed: stats.jobsProcessed || 0,
      jobsFailed: stats.jobsFailed || 0,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  public async getMetrics(): Promise<any> {
    return this.jobProcessor?.getStats?.() || { activeJobs: 0, jobsProcessed: 0, jobsFailed: 0, averageLatency: 0 };
  }

  public async getHealth(): Promise<WorkerHealthStatus> {
    const status = await this.getStatus();
    const checks = {
      heartbeatActive: status.alive,
      processorRunning: !this.jobProcessor?.isStopped,
    };

    const healthy = Object.values(checks).every(Boolean);
    return {
      healthy,
      checks,
    };
  }
}
