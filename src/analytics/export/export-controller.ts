import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../api/types';
import { ExportService } from './export-service';
import { ExportScheduler } from './export-scheduler';

/**
 * Controller executing REST actions for analytics data dumps exports.
 */
export class AnalyticsExportController {
  private readonly service: ExportService;
  private readonly scheduler: ExportScheduler;

  constructor(service: ExportService, scheduler: ExportScheduler) {
    this.service = service;
    this.scheduler = scheduler;
  }

  /**
   * Endpoint returning raw file buffer downloads.
   */
  public async exportDeliveries(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, format } = req.body;
      const fmt = format === 'csv' ? 'csv' : 'json';
      const result = await this.service.exportDeliveries({ status }, fmt);

      res.setHeader('Content-Disposition', `attachment; filename=deliveries-export.${fmt}`);
      res.setHeader('Content-Type', fmt === 'csv' ? 'text/csv' : 'application/json');
      res.status(200).send(result.buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Endpoint scheduling automated recurrences.
   */
  public async scheduleRecurringExport(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format, cron } = req.body;
      const fmt = format === 'csv' ? 'csv' : 'json';
      const schedule = await this.scheduler.scheduleRecurringExport(fmt, cron || '0 0 * * *');

      res.status(202).json(schedule);
    } catch (err) {
      next(err);
    }
  }
}
