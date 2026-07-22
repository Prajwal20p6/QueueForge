import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { ProcessDeliveryService } from '../../application/services/process-delivery.service';
import { ScheduleRetryService } from '../../application/services/schedule-retry.service';
import { ResponseSerializer } from '../serializers/response-serializer';
import { requestValidators } from '../validators/request-validators';
import { paramValidators } from '../validators/param-validators';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { ObservabilityContext } from '../../observability/types';

/**
 * Controller executing REST HTTP actions for webhooks and destination delivery dispatch logs.
 */
export class DeliveryController {
  constructor(
    private readonly deliveryService: ProcessDeliveryService | any,
    private readonly scheduleRetryService?: ScheduleRetryService | any,
    private readonly logger?: Logger | any,
    _observability?: ObservabilityContext | any,
    private readonly deliveryRepository?: any
  ) {
    this.logger?.debug?.('DeliveryController initialized', { hasObservability: !!_observability });
  }

  /**
   * GET endpoint retrieving delivery log details by delivery ID.
   */
  public getDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const deliveryId = paramValidators.validateUUID(req.params.deliveryId, 'deliveryId');

      let delivery: any = null;
      if (this.deliveryService && typeof this.deliveryService.getDelivery === 'function') {
        delivery = await this.deliveryService.getDelivery(deliveryId);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findById === 'function') {
        delivery = await this.deliveryRepository.findById(deliveryId);
      }

      if (!delivery) {
        const NotFoundError = (await import('../../shared/errors/not-found-error')).NotFoundError;
        throw new NotFoundError(`Delivery record with ID "${deliveryId}" was not found.`);
      }

      res.status(200).json(ResponseSerializer.success(delivery, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET endpoint listing deliveries with pagination.
   */
  public listDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const pagination = requestValidators.paginationParams(req.query);

      let result: any = { items: [], total: 0 };
      if (this.deliveryService && typeof this.deliveryService.listDeliveries === 'function') {
        result = await this.deliveryService.listDeliveries(pagination);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findPaginated === 'function') {
        result = await this.deliveryRepository.findPaginated(pagination);
      }

      const items = Array.isArray(result) ? result : (result.items || result.data || []);
      const total = typeof result.total === 'number' ? result.total : items.length;

      res.status(200).json(ResponseSerializer.paginated(items, pagination.page, pagination.limit, total, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST endpoint triggering manual retry for a failed delivery (202 Accepted).
   */
  public retryDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const deliveryId = paramValidators.validateUUID(req.params.deliveryId, 'deliveryId');

      if (this.scheduleRetryService && typeof this.scheduleRetryService.scheduleRetry === 'function') {
        await this.scheduleRetryService.scheduleRetry({ deliveryId, ...req.body });
      } else if (this.deliveryService && typeof this.deliveryService.retry === 'function') {
        await this.deliveryService.retry(deliveryId);
      }

      res.status(202).json(ResponseSerializer.accepted(`Delivery retry successfully scheduled for "${deliveryId}".`, correlationId));
    } catch (err: any) {
      next(err);
    }
  };
}
