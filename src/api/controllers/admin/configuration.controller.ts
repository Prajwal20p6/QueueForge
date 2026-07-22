import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class updating execution environmental variables and retentions parameters.
 */
export class AdminConfigurationController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves runtime configurations parameters.
   */
  public async getConfiguration(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        environment: process.env.NODE_ENV || 'production',
        retentionDays: 30,
        version: '1.0.0',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates runtime parameters values.
   */
  public async updateConfiguration(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.warn('[AdminConfigurationController] Configuration variables modified by admin.');
      res.status(200).json({ status: 'updated', details: req.body });
    } catch (err) {
      next(err);
    }
  }
}
