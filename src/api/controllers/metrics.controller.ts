import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../../infrastructure/monitoring/metrics.service';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Controller exposing Prometheus telemetry counters and latency histograms for scraping.
 */
export class MetricsController {
  constructor(
    private readonly metricsRegistry?: any,
    private readonly logger?: Logger | any
  ) {
    this.logger?.debug?.('MetricsController initialized');
  }

  /**
   * GET endpoint exporting Prometheus exposition text format (no auth required).
   */
  public getMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let metricsText = '';
      if (this.metricsRegistry && typeof this.metricsRegistry.metrics === 'function') {
        metricsText = await this.metricsRegistry.metrics();
        res.setHeader('Content-Type', this.metricsRegistry.contentType || 'text/plain; version=0.0.4; charset=utf-8');
      } else if (metricsService && typeof (metricsService as any).getMetricsText === 'function') {
        metricsText = await (metricsService as any).getMetricsText();
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      } else {
        metricsText = '# HELP queueforge_up Binary operational indicator\n# TYPE queueforge_up gauge\nqueueforge_up 1\n';
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      }

      res.status(200).send(metricsText);
    } catch (err: any) {
      next(err);
    }
  };
}
