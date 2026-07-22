import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller executing REST actions for admin accounts.
 */
export class AdminUsersController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves registered user profiles list.
   */
  public async listUsers(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        data: [{ id: 'usr-1', email: 'admin@oneinbox.ai', roles: ['admin'], active: true }],
        total: 1,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Creates brand new admin profile.
   */
  public async createUser(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, roles } = req.body;
      this.logger.info(`[AdminUsersController] Created profile email: ${email}`);
      res.status(201).json({ id: 'usr-2', email, roles, active: true });
    } catch (err) {
      next(err);
    }
  }
}
