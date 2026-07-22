import { DashboardOverview, QueueStatistics } from '../types';

/**
 * Service class compiling status reports for console UI.
 */
export class DashboardBuilder {
  /**
   * Builds overview variables metrics.
   */
  public async buildOverview(): Promise<DashboardOverview> {
    return {
      systemStatus: 'HEALTHY',
      uptimePercent: 99.98,
      activeIncidents: 0,
      totalJobsProcessed: 14520,
    };
  }

  /**
   * Compiles queue configurations.
   */
  public async buildQueueStats(): Promise<QueueStatistics> {
    return {
      waiting: 12,
      active: 4,
      completed: 14500,
      failed: 4,
      delayed: 0,
    };
  }
}
