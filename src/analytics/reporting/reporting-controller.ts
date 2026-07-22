import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../api/types';
import { ReportGenerator } from './report-generator';
import { ReportScheduler } from './report-scheduler';

/**
 * Controller executing REST actions for reporting triggers.
 */
export class AnalyticsReportingController {
  private readonly generator: ReportGenerator;
  private readonly scheduler: ReportScheduler;

  constructor(generator: ReportGenerator, scheduler: ReportScheduler) {
    this.generator = generator;
    this.scheduler = scheduler;
  }

  /**
   * Endpoint generating on-demand summary report.
   */
  public async generateReport(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.body;
      const report = await this.generator.generateReport(type === 'weekly' ? 'weekly' : 'daily');
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Endpoint scheduling automated digest tasks.
   */
  public async scheduleReport(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, cron } = req.body;
      const taskId = await this.scheduler.scheduleReportTask(
        type === 'weekly' ? 'weekly' : 'daily',
        cron || '0 8 * * *'
      );
      res.status(202).json({ status: 'scheduled', taskId });
    } catch (err) {
      next(err);
    }
  }
}
