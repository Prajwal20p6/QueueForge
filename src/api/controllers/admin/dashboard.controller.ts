import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { DashboardBuilder } from '../../../admin/services/dashboard-builder';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller executing REST actions for admin dashboards metrics.
 */
export class AdminDashboardController {
  private readonly builder: DashboardBuilder;
  private readonly logger: Logger;

  constructor(builder: DashboardBuilder, logger: Logger) {
    this.builder = builder;
    this.logger = logger;
  }

  /**
   * Endpoint returning aggregated metrics reports.
   */
  public async getOverview(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.debug('[AdminDashboardController] Compiling dashboard statistics overview');
      const overview = await this.builder.buildOverview();
      const queueStats = await this.builder.buildQueueStats();

      res.status(200).json({
        overview,
        queueStats,
      });
    } catch (err) {
      next(err);
    }
  }
}
