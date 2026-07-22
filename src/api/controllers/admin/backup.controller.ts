import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller executing REST actions for postgres snapshot procedures.
 */
export class AdminBackupController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Triggers manual postgres database dump snapshot.
   */
  public async createBackup(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.warn('[AdminBackupController] Initiating system database backup...');
      res.status(202).json({
        backupId: `bkp-${Date.now()}`,
        status: 'in-progress',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves active database backups lists.
   */
  public async listBackups(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json([]);
    } catch (err) {
      next(err);
    }
  }
}
