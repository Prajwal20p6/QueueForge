import { IDestinationRepository as DestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { Destination } from '../../domain/entities/destination.entity';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { DestinationResponse } from '../dto/destination.dto';
import { PaginationParams, PaginatedResponse, createPaginatedResponse } from '../dto/pagination.dto';
import { DestinationMapper } from '../mappers/destination-mapper';
import { DestinationNotFoundError } from '../errors/destination-not-found-error';

/**
 * Service querying active destination profiles matching custom event payloads.
 */
export class FindDestinationsService {
  constructor(
    private readonly destinationRepository: DestinationRepository | any,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Retrieves all destinations matching pagination parameters.
   */
  public async findAll(pagination: PaginationParams = {}): Promise<PaginatedResponse<DestinationResponse>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;

    let all: Destination[] = [];
    if (typeof this.destinationRepository.findAll === 'function') {
      all = await this.destinationRepository.findAll();
    } else if (typeof this.destinationRepository.findAllActive === 'function') {
      all = await this.destinationRepository.findAllActive();
    }

    const total = all.length;
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);

    const responses = paged.map(dest => DestinationMapper.toResponse(dest));
    return createPaginatedResponse(responses, total, page, limit);
  }

  /**
   * Retrieves destinations by target type.
   */
  public async findByType(
    type: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<DestinationResponse>> {
    const all = await this.destinationRepository.findAll?.() || await this.destinationRepository.findAllActive?.() || [];
    const targetType = String(type).toUpperCase();

    const filtered = all.filter((dest: any) => {
      const destType = typeof dest.getDestinationType === 'function'
        ? dest.getDestinationType().toString().toUpperCase()
        : String(dest.destinationType || dest.type || '').toUpperCase();
      return destType === targetType;
    });

    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const responses = paged.map((dest: any) => DestinationMapper.toResponse(dest));
    return createPaginatedResponse(responses, filtered.length, page, limit);
  }

  /**
   * Retrieves all enabled destination routes.
   */
  public async findEnabled(): Promise<DestinationResponse[]> {
    let active: Destination[] = [];
    if (typeof this.destinationRepository.findAllActive === 'function') {
      active = await this.destinationRepository.findAllActive();
    } else if (typeof this.destinationRepository.findAll === 'function') {
      const all = await this.destinationRepository.findAll();
      active = all.filter((d: any) => d.isEnabled?.() || d.enabled);
    }
    return active.map(dest => DestinationMapper.toResponse(dest));
  }

  /**
   * Retrieves a destination by ID or throws DestinationNotFoundError.
   */
  public async findById(destinationId: string): Promise<DestinationResponse> {
    const dest = await this.destinationRepository.findById?.(destinationId);
    if (!dest) {
      throw new DestinationNotFoundError(destinationId);
    }
    return DestinationMapper.toResponse(dest);
  }

  /**
   * Retrieves all enabled routes matching specific event payload attributes.
   */
  public async findMatching(resultOrFilters: any): Promise<DestinationResponse[]> {
    this.logger?.debug?.(`Finding matching routes for event filters`);

    let activeDestinations: Destination[] = [];
    if (typeof this.destinationRepository.findAllActive === 'function') {
      activeDestinations = await this.destinationRepository.findAllActive();
    } else if (typeof this.destinationRepository.findAll === 'function') {
      activeDestinations = await this.destinationRepository.findAll();
    }

    const payload = typeof resultOrFilters?.getResultPayload === 'function'
      ? {
          emailId: resultOrFilters.getEmailId?.(),
          agentId: resultOrFilters.getAgentId?.(),
          confidenceScore: resultOrFilters.getConfidenceScore?.(),
          ...resultOrFilters.getResultPayload(),
        }
      : resultOrFilters;

    const matched = activeDestinations.filter((dest: any) => {
      if (typeof dest.matches === 'function') {
        return dest.matches(payload);
      }
      if (typeof dest.matchesEventFilter === 'function') {
        return dest.matchesEventFilter(payload);
      }
      return true;
    });

    this.logger?.debug?.(`Matched ${matched.length} active routes from ${activeDestinations.length} candidates.`);
    return matched.map(dest => DestinationMapper.toResponse(dest));
  }
}
