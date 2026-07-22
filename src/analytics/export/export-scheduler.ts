import { Logger } from '../../observability/logging/logger';
import { ExportService } from './export-service';

export interface ExportSchedule {
  id: string;
  format: 'json' | 'csv';
  cronExpression: string;
}

/**
 * Scheduler orchestrating periodic automated reporting backups.
 */
export class ExportScheduler {
  private readonly service: ExportService;
  private readonly logger: Logger;

  constructor(service: ExportService, logger: Logger) {
    this.service = service;
    this.logger = logger;
    this.logger.debug('ExportScheduler initialized', { hasService: !!this.service });
  }

  /**
   * Registers a cron expression schema parameters.
   */
  public async scheduleRecurringExport(format: 'json' | 'csv', cron: string): Promise<ExportSchedule> {
    const id = `sched-${Date.now()}`;
    this.logger.info(`[ExportScheduler] Configured export schedule ID: ${id} | Cron: ${cron}`);
    return {
      id,
      format,
      cronExpression: cron,
    };
  }
}
