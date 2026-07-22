import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { IngestResultService } from '../../application/services/ingest-result.service';
import { ValidateResultService } from '../../application/services/validate-result.service';
import { ResponseSerializer } from '../serializers/response-serializer';
import { requestValidators } from '../validators/request-validators';
import { paramValidators } from '../validators/param-validators';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { ObservabilityContext } from '../../observability/types';

/**
 * Controller executing REST HTTP actions for task result ingestion and queries.
 */
export class ResultController {
  constructor(
    private readonly ingestResultService: IngestResultService | any,
    private readonly validateResultService?: ValidateResultService | any,
    private readonly logger?: Logger | any,
    _observability?: ObservabilityContext | any,
    private readonly resultRepository?: any
  ) {
    this.logger?.debug?.('ResultController initialized', { hasObservability: !!_observability });
  }

  /**
   * Post endpoint ingesting AI classification task result payloads (202 Accepted).
   */
  public ingestResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';

      this.logger?.debug?.('[ResultController] Ingesting task result payload...', { correlationId });

      // 1. Parse & validate request body
      const validatedBody = requestValidators.ingestResult(req.body);

      // 2. Call optional validate service if configured
      if (this.validateResultService && typeof this.validateResultService.validate === 'function') {
        await this.validateResultService.validate(validatedBody);
      }

      // 3. Build AuditContext from request auth/headers
      const auditCtx = {
        actorId: apiReq.auth?.getPrincipalId?.() || (apiReq.auth as any)?.userId || (apiReq.auth as any)?.getIdentifier?.() || 'system',
        ipAddress: req.ip,
        userAgent: req.header('user-agent'),
      };

      // 4. Ingest result via Application service
      const responseData = await this.ingestResultService.ingest(validatedBody, auditCtx);

      // 5. Set Location header and respond 202 Accepted
      res.setHeader('Location', `/api/v1/results/${responseData.resultId}`);
      res.status(202).json(ResponseSerializer.accepted(`Task result successfully accepted and queued as ${responseData.resultId}`, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET endpoint retrieving a result record by result ID (200 OK).
   */
  public getResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const resultId = paramValidators.validateUUID(req.params.resultId, 'resultId');

      this.logger?.debug?.(`[ResultController] Fetching result "${resultId}"`, { correlationId });

      let resultRecord: any = null;
      const repo = this.resultRepository || this.ingestResultService?.resultRepository;
      if (repo) {
        if (typeof repo.findById === 'function') {
          resultRecord = await repo.findById(resultId);
        } else if (typeof repo.getById === 'function') {
          try {
            resultRecord = await repo.getById(resultId);
          } catch {
            resultRecord = null;
          }
        }
      } else if (this.ingestResultService && typeof this.ingestResultService.getResult === 'function') {
        resultRecord = await this.ingestResultService.getResult(resultId);
      }

      if (!resultRecord) {
        const NotFoundError = (await import('../../shared/errors/not-found-error')).NotFoundError;
        throw new NotFoundError(`Task result record with ID "${resultId}" was not found.`);
      }

      const ResultMapper = (await import('../../application/mappers/result-mapper')).ResultMapper;
      const formatted = typeof (resultRecord as any)?.getId === 'function'
        ? ResultMapper.toResponse(resultRecord)
        : resultRecord;

      res.status(200).json(ResponseSerializer.success(formatted, correlationId));
    } catch (err: any) {
      next(err);
    }
  };
}
