import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class serving raw PromQL registry files.
 */
export class AdminMetricsController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Endpoint returning raw metrics snapshot data.
   */
  public async getMetricsSnapshot(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.debug('[AdminMetricsController] Compiling metrics snapshot file...');
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send('# HELP queue_depth Active jobs in queue\n# TYPE queue_depth gauge\nqueue_depth 12\n');
    } catch (err) {
      next(err);
    }
  }
}
