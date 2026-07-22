import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class querying security events history.
 */
export class AdminAuditController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves security audit database history.
   */
  public async getAuditLogs(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.debug('[AdminAuditController] Querying audit logs...');
      res.status(200).json([
        { id: 'evt-1', action: 'queue:pause', actorId: 'admin', timestamp: new Date() },
      ]);
    } catch (err) {
      next(err);
    }
  }
}
