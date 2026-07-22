import { BusinessMetricsCalculator } from '../metrics/business-metrics';
import { InsightGenerator } from '../insights/insight-generator';
import { Report } from '../types';

/**
 * Report builder compiling summaries for executive briefings.
 */
export class ReportGenerator {
  private readonly metricsCalc: BusinessMetricsCalculator;
  private readonly insightsGen: InsightGenerator;

  constructor(metricsCalc: BusinessMetricsCalculator, insightsGen: InsightGenerator) {
    this.metricsCalc = metricsCalc;
    this.insightsGen = insightsGen;
  }

  /**
   * Generates summary reports detailing metrics and insights.
   */
  public async generateReport(type: 'daily' | 'weekly'): Promise<Report> {
    const metrics = await this.metricsCalc.calculateMetrics();
    const insights = await this.insightsGen.generateInsights();

    return {
      id: `rep-${Date.now()}`,
      type,
      generatedAt: new Date(),
      metrics,
      insights,
    };
  }
}
