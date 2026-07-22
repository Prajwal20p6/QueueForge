import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class executing REST actions for Prometheus alert definitions updates.
 */
export class AdminAlertController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves active triggered alerts list.
   */
  public async listAlerts(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json([]);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Acknowledges triggered alert message block.
   */
  public async acknowledgeAlert(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.info(`[AdminAlertController] Acknowledged triggered alert ID: ${id}`);
      res.status(200).json({ alertId: id, status: 'acknowledged' });
    } catch (err) {
      next(err);
    }
  }
}
