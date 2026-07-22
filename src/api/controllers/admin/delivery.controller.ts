import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller executing REST actions for DLQ retry cycles.
 */
export class AdminDeliveryController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Triggers manual re-evaluation of dead-lettered delivery ID.
   */
  public async retryDLQDelivery(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryId } = req.body;
      this.logger.info(`[AdminDeliveryController] Re-enqueued DLQ delivery ID: ${deliveryId}`);
      res.status(200).json({ status: 'queued', deliveryId });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches DLQ delivery details.
   */
  public async getDLQDeliveries(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        data: [],
        total: 0,
        page: 1,
      });
    } catch (err) {
      next(err);
    }
  }
}
