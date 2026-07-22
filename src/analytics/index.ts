import { ExportService } from './export/export-service';
import { ExportScheduler } from './export/export-scheduler';
import { StreamingExporter } from './export/export-streaming';
import { InsightGenerator } from './insights/insight-generator';
import { InsightStorage } from './insights/insight-storage';
import { BusinessMetricsCalculator } from './metrics/business-metrics';
import { CustomMetrics } from './metrics/custom-metrics';
import { DashboardBuilder } from './dashboards/dashboard-builder';
import { ReportGenerator } from './reporting/report-generator';
import { ReportScheduler } from './reporting/report-scheduler';
import { AnalyticsQueryBuilder } from './query/analytics-query-builder';
import { QueryValidator } from './query/query-validator';
import { AdhocQueryRunner } from './query/adhoc-query';
import { AnalyticsCache } from './cache/analytics-cache';

export {
  ExportService,
  ExportScheduler,
  StreamingExporter,
  InsightGenerator,
  InsightStorage,
  BusinessMetricsCalculator,
  CustomMetrics,
  DashboardBuilder,
  ReportGenerator,
  ReportScheduler,
  AnalyticsQueryBuilder,
  QueryValidator,
  AdhocQueryRunner,
  AnalyticsCache,
};
export * from './types';
export { createAnalyticsRouter } from './routes/analytics.routes';
export { analyticsConfig } from '../config/analytics-config';
export interface AnalyticsContext {
  exportService: ExportService;
  exportScheduler: ExportScheduler;
  insightGenerator: InsightGenerator;
  insightStorage: InsightStorage;
  businessMetrics: BusinessMetricsCalculator;
}
