import { Router } from 'express';
import { AnalyticsExportController } from '../export/export-controller';
import { AnalyticsInsightsController } from '../insights/insights-controller';
import { AnalyticsMetricsController } from '../metrics/metrics-controller';
import { AnalyticsReportingController } from '../reporting/reporting-controller';
import { ExportService } from '../export/export-service';
import { ExportScheduler } from '../export/export-scheduler';
import { InsightGenerator } from '../insights/insight-generator';
import { InsightStorage } from '../insights/insight-storage';
import { BusinessMetricsCalculator } from '../metrics/business-metrics';
import { ReportGenerator } from '../reporting/report-generator';
import { ReportScheduler } from '../reporting/report-scheduler';
import { Logger } from '../../observability/logging/logger';
import { getConfig } from '../../config';

export function createAnalyticsRouter(): Router {
  const router = Router();
  const logger = new Logger(getConfig().observability, 'AnalyticsRouter');

  const exportService = new ExportService(logger);
  const exportScheduler = new ExportScheduler(exportService, logger);
  const insightGenerator = new InsightGenerator();
  const insightStorage = new InsightStorage(logger);
  const metricsCalculator = new BusinessMetricsCalculator();
  const reportGenerator = new ReportGenerator(metricsCalculator, insightGenerator);
  const reportScheduler = new ReportScheduler(reportGenerator, logger);

  const exportController = new AnalyticsExportController(exportService, exportScheduler);
  const insightsController = new AnalyticsInsightsController(insightGenerator, insightStorage);
  const metricsController = new AnalyticsMetricsController(metricsCalculator);
  const reportingController = new AnalyticsReportingController(reportGenerator, reportScheduler);

  router.post('/export/deliveries', exportController.exportDeliveries.bind(exportController));
  router.post('/export/schedule', exportController.scheduleRecurringExport.bind(exportController));
  router.get('/insights', insightsController.getInsights.bind(insightsController));
  router.get('/metrics', metricsController.getBusinessMetrics.bind(metricsController));
  router.post('/reports/generate', reportingController.generateReport.bind(reportingController));
  router.post('/reports/schedule', reportingController.scheduleReport.bind(reportingController));

  return router;
}
