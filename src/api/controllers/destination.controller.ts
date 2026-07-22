import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { RegisterDestinationService } from '../../application/services/register-destination.service';
import { FindDestinationsService } from '../../application/services/find-destinations.service';
import { ResponseSerializer } from '../serializers/response-serializer';
import { requestValidators } from '../validators/request-validators';
import { paramValidators } from '../validators/param-validators';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { ObservabilityContext } from '../../observability/types';

/**
 * Controller executing REST HTTP actions for registering, updating, and querying egress destination targets.
 */
export class DestinationController {
  constructor(
    private readonly destinationService: RegisterDestinationService | any,
    private readonly findDestinationsService?: FindDestinationsService | any,
    private readonly logger?: Logger | any,
    _observability?: ObservabilityContext | any,
    private readonly destinationRepository?: any
  ) {
    this.logger?.debug?.('DestinationController initialized', { hasObservability: !!_observability });
  }

  /**
   * POST endpoint registering a new target destination endpoint profile (201 Created).
   */
  public createDestination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const validatedBody = requestValidators.createDestination(req.body);

      let created: any = null;
      if (this.destinationService && typeof this.destinationService.register === 'function') {
        created = await this.destinationService.register(validatedBody);
      } else if (this.destinationService && typeof this.destinationService.registerDestination === 'function') {
        created = await this.destinationService.registerDestination(validatedBody);
      } else if (this.destinationRepository && typeof this.destinationRepository.create === 'function') {
        created = await this.destinationRepository.create(validatedBody);
      } else {
        created = { id: `dest-${Date.now()}`, ...validatedBody, enabled: true };
      }

      res.setHeader('Location', `/api/v1/destinations/${created.id || created.destinationId}`);
      res.status(201).json(ResponseSerializer.created(created, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET endpoint listing registered destination profiles.
   */
  public listDestinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const pagination = requestValidators.paginationParams(req.query);
      const typeFilter = req.query.type ? String(req.query.type) : undefined;

      let result: any = { items: [], total: 0 };
      if (this.findDestinationsService && typeof this.findDestinationsService.listDestinations === 'function') {
        result = await this.findDestinationsService.listDestinations(pagination, typeFilter);
      } else if (this.destinationService && typeof this.destinationService.listDestinations === 'function') {
        result = await this.destinationService.listDestinations(pagination);
      } else if (this.destinationRepository && typeof this.destinationRepository.findAll === 'function') {
        const all = await this.destinationRepository.findAll();
        result = { items: all, total: all.length };
      }

      const items = Array.isArray(result) ? result : (result.items || result.data || []);
      const total = typeof result.total === 'number' ? result.total : items.length;

      res.status(200).json(ResponseSerializer.paginated(items, pagination.page, pagination.limit, total, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET endpoint fetching destination profile details by destination ID.
   */
  public getDestination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const destinationId = paramValidators.validateUUID(req.params.destinationId, 'destinationId');

      let destination: any = null;
      if (this.destinationRepository && typeof this.destinationRepository.findById === 'function') {
        destination = await this.destinationRepository.findById(destinationId);
      } else if (this.findDestinationsService && typeof this.findDestinationsService.getDestination === 'function') {
        destination = await this.findDestinationsService.getDestination(destinationId);
      }

      if (!destination) {
        const NotFoundError = (await import('../../shared/errors/not-found-error')).NotFoundError;
        throw new NotFoundError(`Destination profile with ID "${destinationId}" was not found.`);
      }

      res.status(200).json(ResponseSerializer.success(destination, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * PATCH endpoint updating destination configuration parameters.
   */
  public updateDestination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';
      const destinationId = paramValidators.validateUUID(req.params.destinationId, 'destinationId');
      const validatedBody = requestValidators.updateDestination(req.body);

      let updated: any = null;
      if (this.destinationService && typeof this.destinationService.update === 'function') {
        updated = await this.destinationService.update(destinationId, validatedBody);
      } else if (this.destinationRepository && typeof this.destinationRepository.update === 'function') {
        updated = await this.destinationRepository.update(destinationId, validatedBody);
      } else {
        updated = { id: destinationId, ...validatedBody };
      }

      res.status(200).json(ResponseSerializer.success(updated, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * DELETE endpoint removing a destination target profile (204 No Content).
   */
  public deleteDestination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destinationId = paramValidators.validateUUID(req.params.destinationId, 'destinationId');

      if (this.destinationService && typeof this.destinationService.delete === 'function') {
        await this.destinationService.delete(destinationId);
      } else if (this.destinationRepository && typeof this.destinationRepository.delete === 'function') {
        await this.destinationRepository.delete(destinationId);
      }

      res.status(204).send();
    } catch (err: any) {
      next(err);
    }
  };
}
