import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../api/types';
import { BusinessMetricsCalculator } from './business-metrics';

/**
 * Controller executing REST actions for KPIs overviews queries.
 */
export class AnalyticsMetricsController {
  private readonly calculator: BusinessMetricsCalculator;

  constructor(calculator: BusinessMetricsCalculator) {
    this.calculator = calculator;
  }

  /**
   * Endpoint returning aggregated metrics reports.
   */
  public async getBusinessMetrics(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await this.calculator.calculateMetrics();
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }
}
