import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

/**
 * REST controller serving real-time QueueForge monitoring metrics.
 */
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getDashboardData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  public getQueueStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getQueueStatistics();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
