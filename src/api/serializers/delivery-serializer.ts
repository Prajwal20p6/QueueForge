import { DeliveryResponse, DeliveryListResponse } from '../../application/dto/delivery.dto';

/**
 * Serializer class converting database delivery and attempt logs to standard REST response DTOs.
 */
export class DeliverySerializer {
  /**
   * Serializes a single delivery model and optionally embeds attempts history.
   */
  public serializeDelivery(delivery: any, attempts?: any[]): DeliveryResponse {
    const listAttempts = attempts || delivery.attempts;
    return {
      id: delivery.id,
      taskResultId: delivery.taskResultId,
      destinationId: delivery.destinationId,
      status: delivery.status,
      retryCount: delivery.retryCount,
      nextRetryAt: delivery.nextRetryAt || undefined,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
      attempts: listAttempts
        ? listAttempts.map((a: any) => ({
            id: a.id,
            responseStatus: a.responseStatus ?? undefined,
            responseTimeMs: a.responseTimeMs ?? undefined,
            errorMessage: a.errorMessage || undefined,
            attemptedAt: a.attemptedAt || a.createdAt,
          }))
        : undefined,
    } as any;
  }

  /**
   * Serializes a paginated list of deliveries.
   */
  public serializeDeliveryList(
    deliveries: any[],
    total: number,
    page: number,
    limit: number
  ): DeliveryListResponse {
    const data = deliveries.map((d) => this.serializeDelivery(d));
    const hasMore = page * limit < total;

    return {
      data,
      total,
      page,
      limit,
      hasMore,
    };
  }
}
