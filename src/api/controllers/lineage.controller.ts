import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { ResponseSerializer } from '../serializers/response-serializer';
import { paramValidators } from '../validators/param-validators';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { ObservabilityContext } from '../../observability/types';

/**
 * Controller executing REST HTTP actions for tracking lifecycle audit lineages of classified task results.
 */
export class LineageController {
  constructor(
    private readonly resultService: any,
    private readonly logger?: Logger | any,
    _observability?: ObservabilityContext | any,
    private readonly resultRepository?: any
  ) {
    this.logger?.debug?.('LineageController initialized', { hasObservability: !!_observability });
  }

  /**
   * GET endpoint retrieving historical event lineage trace records for a specific emailId.
   */
  public getLineage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const emailId = paramValidators.validateEmail(req.params.emailId);

      this.logger?.debug?.(`[LineageController] Querying lineage trace for emailId "${emailId}"`, { correlationId });

      let lineage: any = null;
      if (this.resultService && typeof this.resultService.getLineage === 'function') {
        lineage = await this.resultService.getLineage(emailId);
      } else if (this.resultRepository && typeof this.resultRepository.findByEmailId === 'function') {
        const records = await this.resultRepository.findByEmailId(emailId);
        if (records && records.length > 0) {
          lineage = {
            emailId,
            totalRecords: records.length,
            records,
            traceId: correlationId,
          };
        }
      }

      if (!lineage) {
        const NotFoundError = (await import('../../shared/errors/not-found-error')).NotFoundError;
        throw new NotFoundError(`No classification lineage records found matching email "${emailId}".`);
      }

      res.status(200).json(ResponseSerializer.success(lineage, correlationId));
    } catch (err: any) {
      next(err);
    }
  };
}
