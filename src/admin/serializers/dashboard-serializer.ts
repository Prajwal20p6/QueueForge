import { DashboardOverview, QueueStatistics } from '../types';

/**
 * Serializer class formatting dashboard payloads responses.
 */
export class DashboardSerializer {
  /**
   * Serializes dashboard overview structures.
   */
  public serializeOverview(data: DashboardOverview) {
    return {
      status: data.systemStatus.toLowerCase(),
      uptime: `${data.uptimePercent.toFixed(2)}%`,
      incidentsCount: data.activeIncidents,
      jobsCount: data.totalJobsProcessed,
    };
  }

  /**
   * Serializes queue depths statistics metrics.
   */
  public serializeQueueStats(stats: QueueStatistics) {
    return {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      delayed: stats.delayed,
      totalCount: stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed,
    };
  }
}
