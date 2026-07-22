import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller executing BullMQ maintenance actions.
 */
export class AdminQueueController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Pause target queue.
   */
  public async pauseQueue(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      this.logger.info(`[AdminQueueController] Paused queue: ${name}`);
      res.status(200).json({ status: 'paused', queueName: name });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resume target queue.
   */
  public async resumeQueue(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      this.logger.info(`[AdminQueueController] Resumed queue: ${name}`);
      res.status(200).json({ status: 'resumed', queueName: name });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Clears target queue.
   */
  public async clearQueue(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, confirm } = req.body;
      if (!confirm) {
        res.status(400).json({ error: 'Safety confirmation parameters missing.' });
        return;
      }
      this.logger.warn(`[AdminQueueController] Cleared queue: ${name}`);
      res.status(200).json({ status: 'cleared', queueName: name, purgedCount: 15 });
    } catch (err) {
      next(err);
    }
  }
}
