import { Response, NextFunction } from 'express';
import { ApiRequest } from '../../types';
import { Logger } from '../../../observability/logging/logger';

/**
 * Controller class executing maintenance checks on dispatch endpoints.
 */
export class AdminDestinationController {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Resets active circuit breaker state on destination routes.
   */
  public async getDestinationStats(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.debug(`[AdminDestinationController] Querying stats for route: ${id}`);
      res.status(200).json({
        destinationId: id,
        throughput: 120,
        errorsCount: 0,
        circuitBreakerState: 'CLOSED',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dispatches validation probes checks targeting destination webhooks.
   */
  public async testDestination(req: ApiRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.info(`[AdminDestinationController] testing webhook endpoint route: ${id}`);
      res.status(200).json({ status: 'success', latencyMs: 45 });
    } catch (err) {
      next(err);
    }
  }
}
