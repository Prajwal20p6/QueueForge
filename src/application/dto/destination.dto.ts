/**
 * Payload parameters required to register a new delivery destination route.
 */
export interface CreateDestinationRequest {
  /** Destination delivery type channel category */
  type?: 'WEBHOOK' | 'DATABASE' | 'QUEUE' | 'AUDIT' | string;
  /** Target endpoint url or connection string */
  endpoint?: string;
  /** Alias for endpoint URL */
  endpointUrl?: string;
  /** Destination delivery type channel category alias */
  destinationType?: 'WEBHOOK' | 'DATABASE' | 'QUEUE' | 'AUDIT' | string;
  /** Key-value criteria filters checking payload matching rules */
  eventFilters?: Record<string, any>;
  /** Custom retry strategy configuration */
  retryStrategy?: {
    type: string;
    config: Record<string, any>;
  };
  /** Circuit breaker consecutive failure threshold before opening */
  circuitBreakerThreshold?: number;
  /** Execution timeout duration in milliseconds */
  timeout?: number;
  /** Activates or deactivates routing to this destination */
  enabled?: boolean;
}

/**
 * Parameters allowed when modifying an existing destination registration.
 */
export interface UpdateDestinationRequest {
  /** Target endpoint URL or connection string */
  endpoint?: string;
  /** Target endpoint URL alias */
  endpointUrl?: string;
  /** Key-value routing filters criteria */
  eventFilters?: Record<string, any>;
  /** Custom retry strategy configuration */
  retryStrategy?: {
    type?: string;
    config?: Record<string, any>;
  };
  /** Circuit breaker consecutive failure threshold */
  circuitBreakerThreshold?: number;
  /** Execution timeout duration in milliseconds */
  timeout?: number;
  /** Destination status */
  enabled?: boolean;
}

/**
 * Representation of a registered delivery destination route.
 */
export interface DestinationResponse {
  /** Unique destination identifier (UUID) */
  id: string;
  /** Optional helper getter method for compatibility */
  getId?: (() => string) | any;
  /** Destination delivery type channel string */
  type?: string;
  /** Destination delivery type channel alias */
  destinationType?: string;
  /** Target endpoint URL or connection string */
  endpoint?: string;
  /** Target endpoint URL alias */
  endpointUrl?: string;
  /** Key-value routing filters criteria */
  eventFilters?: Record<string, any>;
  /** Destination status enabled flag */
  enabled: boolean;
  /** Configured retry strategy details object */
  retryStrategy?: Record<string, any>;
  /** Consecutive failure count threshold triggering circuit breaker */
  circuitBreakerThreshold?: number;
  /** Execution timeout duration in milliseconds */
  timeout?: number;
  /** Route registration date */
  createdAt: Date;
  /** Route modifications date */
  updatedAt: Date;
}

/**
 * Collection response representing registered destination records.
 */
export interface DestinationListResponse {
  /** Array of formatted destination registrations */
  data: DestinationResponse[];
  /** Total count of matching destination registrations in storage */
  total: number;
  /** Pagination metadata structure */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
