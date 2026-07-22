/**
 * Standardized success response envelope for QueueForge API responses.
 */
export interface SuccessResponseEnvelope<T> {
  data: T;
  timestamp: string;
  traceId?: string;
}

/**
 * Standardized paginated response envelope for QueueForge API list queries.
 */
export interface PaginatedResponseEnvelope<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
  traceId?: string;
}

/**
 * Standardized async accepted envelope for queued operations (202 Accepted).
 */
export interface AcceptedResponseEnvelope {
  message: string;
  status: 'ACCEPTED' | 'QUEUED';
  timestamp: string;
  traceId?: string;
}

/**
 * Helper class producing uniform JSON response structures across all HTTP endpoints.
 */
export class ResponseSerializer {
  /**
   * Wraps payload in standard success envelope (200 OK).
   */
  public static success<T>(data: T, traceId?: string): SuccessResponseEnvelope<T> {
    return {
      data,
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    };
  }

  /**
   * Wraps items and pagination metadata in standardized paginated response envelope.
   */
  public static paginated<T>(
    items: T[],
    page: number = 1,
    limit: number = 20,
    total: number = items.length,
    traceId?: string
  ): PaginatedResponseEnvelope<T> {
    const totalPages = Math.ceil(total / (limit || 1)) || 1;
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    };
  }

  /**
   * Serializes payload for newly created resource (201 Created).
   */
  public static created<T>(data: T, traceId?: string): SuccessResponseEnvelope<T> {
    return {
      data,
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    };
  }

  /**
   * Serializes standard 202 Accepted async operation response.
   */
  public static accepted(
    message: string = 'Operation accepted for asynchronous processing.',
    traceId?: string
  ): AcceptedResponseEnvelope {
    return {
      message,
      status: 'ACCEPTED',
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    };
  }
}
