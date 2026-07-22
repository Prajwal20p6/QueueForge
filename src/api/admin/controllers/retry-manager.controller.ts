import { Request, Response, NextFunction } from 'express';
import { RetryManagerService } from '../services/retry-manager.service';

/**
 * REST controller managing manual single & batch retry operations.
 */
export class RetryManagerController {
  constructor(private readonly retryService: RetryManagerService) {}

  public retryDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.retryService.retryDelivery(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  public retryBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryIds } = req.body;
      const result = await this.retryService.retryBatch(deliveryIds || []);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
