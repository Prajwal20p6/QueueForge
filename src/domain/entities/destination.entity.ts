import { v4 as uuidv4 } from 'uuid';
import { DestinationTypeVO } from '../value-objects/destination-type.vo';
import { RetryStrategyVO } from '../value-objects/retry-strategy.vo';
import { ValidationError } from '../../shared/errors/validation-error';
import { AggregateRoot } from '../types/aggregates.types';

/**
 * Domain Entity representing a target output destination system.
 */
export class Destination extends AggregateRoot {
  private readonly _type: DestinationTypeVO;
  private readonly _endpoint: string;
  private readonly _eventFilters: Record<string, any> | null;
  private readonly _retryStrategy: RetryStrategyVO;
  private _circuitBreakerThreshold: number;
  private readonly _timeout: number;
  private _enabled: boolean;
  private _metadata: Record<string, any>;
  private _updatedAt: Date;

  constructor(
    id: string,
    type: DestinationTypeVO,
    endpoint: string,
    eventFilters: Record<string, any> | null,
    retryStrategy: RetryStrategyVO,
    circuitBreakerThreshold: number,
    timeout: number,
    enabled: boolean,
    metadata: Record<string, any>,
    createdAt: Date,
    updatedAt?: Date,
    deletedAt: Date | null = null
  ) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Destination ID must be a non-empty string.');
    }
    if (!type || !(type instanceof DestinationTypeVO)) {
      throw new ValidationError('Destination type must be a valid DestinationTypeVO.');
    }
    if (!endpoint || typeof endpoint !== 'string') {
      throw new ValidationError('Destination endpoint must be a non-empty string.');
    }
    if (!retryStrategy || !(retryStrategy instanceof RetryStrategyVO)) {
      throw new ValidationError('Destination retryStrategy must be a valid RetryStrategyVO.');
    }
    if (typeof circuitBreakerThreshold !== 'number' || circuitBreakerThreshold < 1) {
      throw new ValidationError('Circuit breaker threshold must be an integer >= 1.');
    }
    if (typeof timeout !== 'number' || timeout < 1) {
      throw new ValidationError('Destination timeout must be a positive integer.');
    }

    // Validate endpoint format based on destination type
    Destination.validateEndpoint(type, endpoint);

    super(id, createdAt ? new Date(createdAt) : new Date(), deletedAt);
    this._type = type;
    this._endpoint = endpoint;
    this._eventFilters = eventFilters;
    this._retryStrategy = retryStrategy;
    this._circuitBreakerThreshold = circuitBreakerThreshold;
    this._timeout = timeout;
    this._enabled = enabled ?? true;
    this._metadata = metadata || {};
    this._updatedAt = updatedAt ? new Date(updatedAt) : new Date(this.createdAt);
  }

  private static validateEndpoint(type: DestinationTypeVO, endpoint: string): void {
    if (type.isWebhook()) {
      if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        throw new ValidationError(`Webhook endpoint must start with http:// or https://. Received: ${endpoint}`);
      }
    }
  }

  public getType(): DestinationTypeVO {
    return this._type;
  }

  public getDestinationType(): DestinationTypeVO {
    return this._type;
  }

  public getEndpoint(): string {
    return this._endpoint;
  }

  public getEndpointUrl(): string {
    return this._endpoint;
  }

  public getEventFilters(): Record<string, any> | null {
    return this._eventFilters;
  }

  public get eventFilters(): Record<string, any> | null {
    return this._eventFilters;
  }

  public getRetryStrategy(): RetryStrategyVO {
    return this._retryStrategy;
  }

  public getCircuitBreakerThreshold(): number {
    return this._circuitBreakerThreshold;
  }

  public getTimeout(): number {
    return this._timeout;
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this._updatedAt = new Date();
  }

  public disable(): void {
    this.setEnabled(false);
  }

  public getMetadata(): Record<string, any> {
    return { ...this._metadata };
  }

  public setMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...metadata };
    this._updatedAt = new Date();
  }

  public getUpdatedAt(): Date {
    return new Date(this._updatedAt);
  }

  public updateCircuitBreakerThreshold(threshold: number): void {
    if (typeof threshold !== 'number' || threshold < 1) {
      throw new ValidationError('Circuit breaker threshold must be an integer >= 1.');
    }
    this._circuitBreakerThreshold = threshold;
    this._updatedAt = new Date();
  }

  /**
   * Evaluates if event parameters match the configured event filters.
   */
  public matchesEventFilter(event: Record<string, any>): boolean {
    if (!this._eventFilters || Object.keys(this._eventFilters).length === 0) {
      return true;
    }
    for (const [key, filterValue] of Object.entries(this._eventFilters)) {
      if (event[key] !== filterValue) {
        return false;
      }
    }
    return true;
  }

  public matches(event: Record<string, any>): boolean {
    return this.matchesEventFilter(event);
  }

  /**
   * Compares identity equality with another Destination entity.
   */
  public override equals(other: any): boolean {
    if (!other || !(other instanceof Destination)) {
      return false;
    }
    return this.id === other.id;
  }

  /**
   * Static restore method for rehydrating from database / persistence.
   */
  public static restore(params: {
    id: string;
    type?: DestinationTypeVO | string | any;
    destinationType?: DestinationTypeVO | string | any;
    endpoint?: string;
    endpointUrl?: string;
    eventFilters?: Record<string, any> | null;
    retryStrategy?: RetryStrategyVO | any;
    circuitBreakerThreshold?: number;
    timeout?: number;
    enabled?: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }): Destination {
    const rawType = params.type || params.destinationType;
    const typeObj = rawType instanceof DestinationTypeVO ? rawType : DestinationTypeVO.create(rawType);
    const endpointStr = params.endpoint || params.endpointUrl || '';
    const retryObj = params.retryStrategy instanceof RetryStrategyVO
      ? params.retryStrategy
      : (typeof params.retryStrategy === 'object' && params.retryStrategy && params.retryStrategy.type
        ? RetryStrategyVO.create(params.retryStrategy.type, params.retryStrategy.config || params.retryStrategy)
        : RetryStrategyVO.exponential());

    return new Destination(
      params.id,
      typeObj,
      endpointStr,
      params.eventFilters || null,
      retryObj,
      params.circuitBreakerThreshold ?? 5,
      params.timeout ?? 30000,
      params.enabled ?? true,
      params.metadata || {},
      params.createdAt,
      params.updatedAt,
      params.deletedAt || null
    );
  }

  /**
   * Factory method for creating a new Destination entity instance.
   * Supports both single object params and positional arguments.
   */
  public static create(
    typeOrParams: DestinationTypeVO | any,
    endpoint?: string,
    retryStrategy?: RetryStrategyVO,
    circuitBreakerThreshold = 5,
    timeout = 30000,
    eventFilters: Record<string, any> | null = null,
    metadata: Record<string, any> = {},
    id?: string
  ): Destination {
    if (typeof typeOrParams === 'object' && !(typeOrParams instanceof DestinationTypeVO) && typeOrParams.type) {
      const p = typeOrParams;
      const typeObj = p.type instanceof DestinationTypeVO ? p.type : DestinationTypeVO.create(p.type);
      const retryObj = p.retryStrategy instanceof RetryStrategyVO
        ? p.retryStrategy
        : (p.retryStrategy ? RetryStrategyVO.create(p.retryStrategy.type || 'EXPONENTIAL', p.retryStrategy.config || p.retryStrategy) : RetryStrategyVO.exponential());
      return new Destination(
        p.id || uuidv4(),
        typeObj,
        p.endpoint || p.endpointUrl,
        p.eventFilters || null,
        retryObj,
        p.circuitBreakerThreshold || 5,
        p.timeout || 30000,
        p.enabled ?? true,
        p.metadata || {},
        p.createdAt || new Date(),
        p.updatedAt || new Date()
      );
    }

    const type = typeOrParams as DestinationTypeVO;
    const entityId = id || uuidv4();
    const now = new Date();
    return new Destination(
      entityId,
      type,
      endpoint!,
      eventFilters,
      retryStrategy!,
      circuitBreakerThreshold,
      timeout,
      true,
      metadata,
      now,
      now
    );
  }
}
