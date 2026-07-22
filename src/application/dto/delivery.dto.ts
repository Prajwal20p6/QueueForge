/**
 * Execution details representing an individual delivery attempt log.
 */
export interface AttemptResponse {
  /** Attempt sequence number (1-based) */
  number: number;
  /** HTTP response status code parsed from target webhook response */
  statusCode?: number;
  /** Execution elapsed duration in milliseconds */
  latencyMs?: number;
  /** Network connection or server execution detail message on failure */
  error?: string;
  /** Timestamp when attempt occurred */
  timestamp: Date;
}

/**
 * Serialized representation of a task result delivery state.
 */
export interface DeliveryResponse {
  /** Unique delivery job identifier reference (UUID) */
  id: string;
  /** AI task result identifier reference (UUID) */
  taskResultId: string;
  /** Destination identifier matching the route (UUID) */
  destinationId: string;
  /** Delivery status string (e.g. PENDING, PROCESSING, COMPLETED, SCHEDULED_RETRY, FAILED_DLQ) */
  status: string;
  /** Total retry processing count */
  retryCount: number;
  /** Scheduled next execution timestamp if in retry backoff state */
  nextRetryAt?: Date | null;
  /** Timestamp of the most recent execution attempt */
  lastAttemptAt?: Date | null;
  /** Categorized error details of the most recent failure if applicable */
  lastError?: {
    category: string;
    message: string;
    statusCode?: number;
  } | null;
  /** Timestamp when delivery was completed */
  completedAt?: Date | null;
  /** List of execution attempt logs */
  attempts?: AttemptResponse[];
  /** Record creation date */
  createdAt?: Date;
  /** Record modification date */
  updatedAt?: Date;
}

/**
 * Collection response representing a paginated array of delivery records.
 */
export interface DeliveryListResponse {
  /** Array of formatted delivery details objects */
  data: DeliveryResponse[];
  /** Total count of matching delivery records in storage */
  total: number;
  /** Active page number reference */
  page: number;
  /** Max records limit per page */
  limit: number;
  /** Indicates if additional pages exist */
  hasMore: boolean;
  /** Pagination metadata structure */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Parameters for manually creating a delivery record.
 */
export interface CreateDeliveryRequest {
  /** Target AI task result identifier reference */
  taskResultId: string;
  /** Destination identifier matching the delivery route */
  destinationId: string;
}

/**
 * Request payload to manually retry a failed delivery.
 */
export interface RetryDeliveryRequest {
  /** Optional override delay in milliseconds */
  delayMs?: number;
}

/**
 * Response payload returned when manual retry is scheduled.
 */
export interface RetryDeliveryResponse {
  deliveryId: string;
  status: string;
  nextRetryAt: Date;
  message: string;
}

/**
 * Execution details representing a delivery attempt logging request.
 */
export interface RecordAttemptRequest {
  responseStatus?: number;
  responseTimeMs?: number;
  errorMessage?: string;
}
