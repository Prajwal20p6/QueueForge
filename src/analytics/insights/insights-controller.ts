import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../api/types';
import { InsightGenerator } from './insight-generator';
import { InsightStorage } from './insight-storage';

/**
 * Controller executing REST actions for trends diagnostics.
 */
export class AnalyticsInsightsController {
  private readonly generator: InsightGenerator;
  private readonly storage: InsightStorage;

  constructor(generator: InsightGenerator, storage: InsightStorage) {
    this.generator = generator;
    this.storage = storage;
  }

  /**
   * Endpoint returning generated insights list.
   */
  public async getInsights(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let insights = await this.storage.getInsights();
      if (insights.length === 0) {
        // Fallback generating new insights
        insights = await this.generator.generateInsights();
        for (const item of insights) {
          await this.storage.saveInsight(item);
        }
      }

      res.status(200).json(insights);
    } catch (err) {
      next(err);
    }
  }
}
