import { Destination } from '../../domain/entities/destination.entity';
import { DestinationTypeVO } from '../../domain/value-objects/destination-type.vo';
import { RetryStrategyVO } from '../../domain/value-objects/retry-strategy.vo';
import { CreateDestinationRequest, DestinationResponse, DestinationListResponse } from '../dto/destination.dto';
import { createPaginatedResponse } from '../dto/pagination.dto';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Mapper converting destination DTOs to/from Destination domain entities.
 */
export class DestinationMapper {
  /**
   * Instantiates a new Destination entity from CreateDestinationRequest DTO.
   */
  public static toDomain(dto: CreateDestinationRequest): Destination {
    if (!dto) {
      throw new ValidationError('CreateDestinationRequest parameters are missing.');
    }

    const typeStr = dto.type || dto.destinationType;
    if (!typeStr) {
      throw new ValidationError('Destination type is required.');
    }

    const endpointStr = dto.endpoint || dto.endpointUrl;
    if (!endpointStr) {
      throw new ValidationError('Destination endpoint URL is required.');
    }

    const type = DestinationTypeVO.create(typeStr);

    let retryStrategy = RetryStrategyVO.exponential();
    if (dto.retryStrategy) {
      retryStrategy = RetryStrategyVO.create(
        dto.retryStrategy.type,
        dto.retryStrategy.config as any
      );
    }

    const entity = Destination.create(
      type,
      endpointStr,
      retryStrategy,
      dto.circuitBreakerThreshold ?? 5,
      dto.timeout ?? 30000,
      dto.eventFilters || null
    );

    if (dto.enabled === false) {
      entity.disable();
    }

    return entity;
  }

  /**
   * Alias method for backward compatibility.
   */
  public static toDomainEntity(dto: CreateDestinationRequest): Destination {
    return DestinationMapper.toDomain(dto);
  }

  /**
   * Serializes a Destination entity into a clean response representation.
   */
  public static toResponse(entity: Destination): DestinationResponse & { getId?: () => string } {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined Destination entity to response.');
    }

    const typeKind = typeof entity.getDestinationType === 'function'
      ? (entity.getDestinationType().getValue?.() || entity.getDestinationType().kind?.toUpperCase() || String(entity.getDestinationType()))
      : String(entity.getDestinationType || 'WEBHOOK');

    const retryConfig = typeof entity.getRetryStrategy === 'function'
      ? {
          type: entity.getRetryStrategy().getType?.() || 'EXPONENTIAL',
          config: entity.getRetryStrategy().getConfig?.() || {},
        }
      : { type: 'EXPONENTIAL', config: {} };

    const responseObj: any = {
      id: entity.getId(),
      type: typeKind,
      destinationType: typeKind,
      endpoint: entity.getEndpointUrl(),
      endpointUrl: entity.getEndpointUrl(),
      eventFilters: entity.getEventFilters() || undefined,
      enabled: entity.isEnabled(),
      retryStrategy: retryConfig,
      circuitBreakerThreshold: entity.getCircuitBreakerThreshold(),
      timeout: entity.getTimeout(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      getId: () => entity.getId(),
    };

    return responseObj;
  }

  /**
   * Serializes an array of Destination entities into a paginated list structure.
   */
  public static toListResponse(entities: Destination[], pagination?: any): DestinationListResponse {
    const data = (entities || []).map((e) => DestinationMapper.toResponse(e));
    const total = pagination?.total ?? entities.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? Math.max(1, data.length);

    const paginated = createPaginatedResponse(data, total, page, limit);
    return {
      data,
      total,
      pagination: paginated.pagination,
    };
  }

  /**
   * Serializes a Destination entity into a raw generic DTO object.
   */
  public static toDTO(entity: Destination): Record<string, any> {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined Destination entity to DTO.');
    }

    return {
      id: entity.getId(),
      type: entity.getDestinationType().toString(),
      endpoint: entity.getEndpointUrl(),
      eventFilters: entity.getEventFilters(),
      enabled: entity.isEnabled(),
      circuitBreakerThreshold: entity.getCircuitBreakerThreshold(),
      timeout: entity.getTimeout(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
