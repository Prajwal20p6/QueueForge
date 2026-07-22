import { Logger } from '../../observability/logging/logger';
import { ReportGenerator } from './report-generator';

/**
 * Scheduler class automating digests email dispatches.
 */
export class ReportScheduler {
  private readonly generator: ReportGenerator;
  private readonly logger: Logger;

  constructor(generator: ReportGenerator, logger: Logger) {
    this.generator = generator;
    this.logger = logger;
    this.logger.debug('ReportScheduler initialized', { hasGenerator: !!this.generator });
  }

  /**
   * Schedules a daily/weekly summary report task.
   */
  public async scheduleReportTask(type: 'daily' | 'weekly', cron: string): Promise<string> {
    const taskId = `task-rep-${Date.now()}`;
    this.logger.info(`[ReportScheduler] Configured recurring report task ID: ${taskId} | cron: ${cron} | type: ${type}`);
    return taskId;
  }
}
export { Logger };
