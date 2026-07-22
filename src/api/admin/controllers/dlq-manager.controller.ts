import { Request, Response, NextFunction } from 'express';
import { DLQManagerService } from '../services/dlq-manager.service';

/**
 * REST controller for Dead-Letter Queue inspection and recovery.
 */
export class DLQManagerController {
  constructor(private readonly dlqService: DLQManagerService) {}

  public listDLQItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.dlqService.listDLQItems(req.query);
      res.status(200).json({ success: true, data: result.data, total: result.total });
    } catch (err) {
      next(err);
    }
  };

  public recoverDLQItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.dlqService.recoverDLQItem(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  public analyzeDLQ = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analysis = await this.dlqService.analyzeDLQPatterns();
      res.status(200).json({ success: true, data: analysis });
    } catch (err) {
      next(err);
    }
  };
}
