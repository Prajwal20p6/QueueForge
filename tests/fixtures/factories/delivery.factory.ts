import { Delivery } from '../../../src/domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../src/domain/value-objects/delivery-status';

/**
 * Builder factory for creating Delivery domain entities in tests.
 * Supports chained configuration and terminal build() call.
 *
 * @example
 * ```typescript
 * const delivery = DeliveryFactory.withStatus(DeliveryStatus.processing()).build();
 * const deliveries = DeliveryFactory.createMany(3);
 * ```
 */
export class DeliveryFactory {
  private _taskResultId = 'test-result-id-001';
  private _destinationId = 'test-destination-id-001';
  private _status: DeliveryStatus = DeliveryStatus.pending();
  private _retryCount = 0;
  private _nextRetryAt: Date | null = null;

  private constructor() {}

  /**
   * Creates a single Delivery entity with PENDING status.
   */
  public static createOne(): Delivery {
    return new DeliveryFactory().build();
  }

  /**
   * Creates an array of Delivery entities with unique task result IDs.
   * @param count - Number of entities to create.
   */
  public static createMany(count: number): Delivery[] {
    return Array.from({ length: count }, (_, i) =>
      new DeliveryFactory()
        .withResultId(`test-result-id-${String(i + 1).padStart(3, '0')}`)
        .withDestinationId(`test-destination-id-${String(i + 1).padStart(3, '0')}`)
        .build()
    );
  }

  /**
   * Sets the delivery status.
   * @param status - DeliveryStatus discriminated union value.
   */
  public static withStatus(status: DeliveryStatus): DeliveryFactory {
    const factory = new DeliveryFactory();
    factory._status = status;
    return factory;
  }

  /**
   * Sets the task result ID.
   * @param id - Task result entity ID.
   */
  public static withResultId(id: string): DeliveryFactory {
    const factory = new DeliveryFactory();
    factory._taskResultId = id;
    return factory;
  }

  /**
   * Sets the destination ID.
   * @param id - Destination entity ID.
   */
  public static withDestinationId(id: string): DeliveryFactory {
    const factory = new DeliveryFactory();
    factory._destinationId = id;
    return factory;
  }

  /**
   * Sets the retry count.
   * @param count - Retry attempt count (≥ 0).
   */
  public static withRetryCount(count: number): DeliveryFactory {
    const factory = new DeliveryFactory();
    factory._retryCount = count;
    return factory;
  }

  /**
   * Sets the status on this factory instance (chainable).
   */
  public withStatus(status: DeliveryStatus): this {
    this._status = status;
    return this;
  }

  /**
   * Sets the task result ID on this factory instance (chainable).
   */
  public withResultId(id: string): this {
    this._taskResultId = id;
    return this;
  }

  /**
   * Sets the destination ID on this factory instance (chainable).
   */
  public withDestinationId(id: string): this {
    this._destinationId = id;
    return this;
  }

  /**
   * Sets the retry count on this factory instance (chainable).
   */
  public withRetryCount(count: number): this {
    this._retryCount = count;
    return this;
  }

  /**
   * Sets the next retry timestamp on this factory instance (chainable).
   */
  public withNextRetryAt(date: Date): this {
    this._nextRetryAt = date;
    return this;
  }

  /**
   * Builds and returns the configured Delivery entity using the restore factory method.
   * Allows setting status and retryCount beyond what create() supports.
   */
  public build(): Delivery {
    return Delivery.restore({
      id: `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskResultId: this._taskResultId,
      destinationId: this._destinationId,
      status: this._status,
      retryCount: this._retryCount,
      nextRetryAt: this._nextRetryAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
