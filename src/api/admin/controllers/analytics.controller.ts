import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

/**
 * REST controller delivering analytical overviews and trend reports.
 */
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeRange = (req.query.timeRange as string) || '24h';
      const overview = await this.analyticsService.getAnalyticsOverview(timeRange);
      res.status(200).json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  };
}
