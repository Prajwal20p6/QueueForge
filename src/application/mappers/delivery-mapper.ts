import { Delivery } from '../../domain/entities/delivery.entity';
import { CreateDeliveryRequest, DeliveryResponse, DeliveryListResponse, AttemptResponse } from '../dto/delivery.dto';
import { createPaginatedResponse } from '../dto/pagination.dto';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Mapper converting delivery DTOs to/from Delivery domain entities.
 */
export class DeliveryMapper {
  /**
   * Instantiates a new Delivery entity.
   */
  public static toDomain(dto: CreateDeliveryRequest | any): Delivery {
    if (!dto || !dto.taskResultId || !dto.destinationId) {
      throw new ValidationError('Task result ID and Destination ID are required to create a Delivery.');
    }
    return Delivery.create(dto.taskResultId, dto.destinationId);
  }

  /**
   * Alias method for backward compatibility.
   */
  public static toDomainEntity(dto: CreateDeliveryRequest | any): Delivery {
    return DeliveryMapper.toDomain(dto);
  }

  /**
   * Serializes a Delivery entity into a clean response representation.
   */
  public static toResponse(
    entity: Delivery,
    attempts?: any[]
  ): DeliveryResponse {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined Delivery entity to response.');
    }

    const rawAttempts = attempts || entity.getAttempts?.() || [];
    const formattedAttempts: AttemptResponse[] = rawAttempts.map((att, idx) => ({
      number: att.number ?? att.attemptNumber ?? idx + 1,
      statusCode: att.statusCode ?? att.responseStatus,
      latencyMs: att.latencyMs ?? att.responseTimeMs,
      error: att.error ?? att.errorMessage,
      timestamp: att.timestamp ? new Date(att.timestamp) : (att.createdAt ? new Date(att.createdAt) : new Date()),
    }));

    const statusVal = typeof entity.getStatus === 'function'
      ? (entity.getStatus().kind || entity.getStatus().getValue?.() || String(entity.getStatus()))
      : String(entity.getStatus || 'PENDING');

    const lastErr = entity.getLastError?.();
    const formattedLastError = lastErr
      ? {
          category: String(lastErr.category || lastErr.name || 'UNKNOWN'),
          message: String(lastErr.message || lastErr),
          statusCode: lastErr.statusCode || undefined,
        }
      : null;

    return {
      id: entity.getId(),
      taskResultId: entity.getTaskResultId(),
      destinationId: entity.getDestinationId(),
      status: statusVal,
      retryCount: entity.getRetryCount(),
      nextRetryAt: entity.getNextRetryAt() || undefined,
      lastAttemptAt: entity.getLastAttemptAt() || undefined,
      lastError: formattedLastError,
      completedAt: entity.getCompletedAt() || undefined,
      attempts: formattedAttempts,
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }

  /**
   * Formats an array of Delivery entities into a paginated list response representation.
   */
  public static toListResponse(
    entities: Delivery[],
    total: number,
    page: number,
    limit: number
  ): DeliveryListResponse {
    const data = (entities || []).map(entity => DeliveryMapper.toResponse(entity));
    const paginated = createPaginatedResponse(data, total, page, limit);

    return {
      data,
      total,
      page,
      limit,
      hasMore: paginated.hasMore ?? false,
      pagination: paginated.pagination,
    };
  }

  /**
   * Serializes a Delivery entity into a raw generic DTO object.
   */
  public static toDTO(entity: Delivery): Record<string, any> {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined Delivery entity to DTO.');
    }

    return {
      id: entity.getId(),
      taskResultId: entity.getTaskResultId(),
      destinationId: entity.getDestinationId(),
      status: entity.getStatus().toString(),
      retryCount: entity.getRetryCount(),
      nextRetryAt: entity.getNextRetryAt(),
      lastAttemptAt: entity.getLastAttemptAt(),
      completedAt: entity.getCompletedAt(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
