import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class checking authorization scopes mapping.
 */
export class AdminRolesController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves active permissions scopes mappings configurations.
   */
  public async listRoles(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json([
        { id: 'role-1', name: 'admin', permissions: ['*'] },
        { id: 'role-2', name: 'operator', permissions: ['queue:pause', 'queue:resume'] },
      ]);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Defines new role permissions maps.
   */
  public async createRole(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, permissions } = req.body;
      this.logger.info(`[AdminRolesController] Created role: ${name}`);
      res.status(201).json({ id: `role-${Date.now()}`, name, permissions });
    } catch (err) {
      next(err);
    }
  }
}
