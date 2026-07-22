import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class logging active incidents and mapping timelines parameters.
 */
export class AdminIncidentController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Retrieves active incidents list.
   */
  public async listIncidents(_req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json([]);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Acknowledges incident alert.
   */
  public async acknowledgeIncident(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.info(`[AdminIncidentController] Acknowledged incident ID: ${id}`);
      res.status(200).json({ incidentId: id, status: 'acknowledged' });
    } catch (err) {
      next(err);
    }
  }
}
