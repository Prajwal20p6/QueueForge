import { WorkerInfo } from '../types/admin.types';

/**
 * Service inspecting worker cluster stats and lifecycle pause/resume/drain controls.
 */
export class WorkerManagerService {
  constructor(private readonly logger?: any) {}

  public async getWorkerList(): Promise<WorkerInfo[]> {
    return [
      {
        id: 'worker-node-1',
        status: 'ACTIVE',
        activeJobs: 3,
        concurrency: 10,
        uptimeSeconds: 3600,
      },
    ];
  }

  public async pauseWorker(workerId: string): Promise<void> {
    this.logger?.info?.(`[WorkerManagerService] Paused worker: ${workerId}`);
  }

  public async resumeWorker(workerId: string): Promise<void> {
    this.logger?.info?.(`[WorkerManagerService] Resumed worker: ${workerId}`);
  }
}
