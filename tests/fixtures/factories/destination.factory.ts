import { Destination } from '../../../src/domain/entities/destination.entity';
import { DestinationType } from '../../../src/domain/value-objects/destination-type';

/**
 * Builder factory for creating Destination domain entities in tests.
 * Supports all four destination types: WEBHOOK, DATABASE, QUEUE, AUDIT.
 *
 * @example
 * ```typescript
 * const dest = DestinationFactory.webhook('https://api.example.com/hook').build();
 * const auditDest = DestinationFactory.audit().enabled(false).build();
 * const dests = DestinationFactory.createMany(3);
 * ```
 */
export class DestinationFactory {
  private _endpointUrl = 'https://webhook.example.com/delivery';
  private _destinationType: DestinationType = DestinationType.webhook();
  private _eventFilters: Record<string, unknown> = {};
  private _enabled = true;

  private constructor() {}

  /**
   * Creates a single Destination entity (WEBHOOK type by default).
   */
  public static createOne(): Destination {
    return new DestinationFactory().build();
  }

  /**
   * Creates an array of Destination entities with unique webhook URLs.
   * @param count - Number of entities to create.
   */
  public static createMany(count: number): Destination[] {
    return Array.from({ length: count }, (_, i) =>
      new DestinationFactory()
        .withUrl(`https://webhook.example.com/endpoint-${i + 1}`)
        .build()
    );
  }

  /**
   * Returns a factory pre-configured for a WEBHOOK destination.
   * @param url - Optional webhook URL (default: test URL).
   */
  public static webhook(url = 'https://webhook.example.com/delivery'): DestinationFactory {
    const factory = new DestinationFactory();
    factory._endpointUrl = url;
    factory._destinationType = DestinationType.webhook();
    return factory;
  }

  /**
   * Returns a factory pre-configured for a DATABASE destination.
   * @param _dbConfig - Optional DB configuration (reflected in eventFilters).
   */
  public static database(_dbConfig?: Record<string, unknown>): DestinationFactory {
    const factory = new DestinationFactory();
    factory._endpointUrl = 'https://db-proxy.oneinbox.ai/write';
    factory._destinationType = DestinationType.database();
    factory._eventFilters = _dbConfig ?? { table: 'ai_results_archive' };
    return factory;
  }

  /**
   * Returns a factory pre-configured for a QUEUE destination.
   * @param queueName - Optional queue name reflected in eventFilters.
   */
  public static queue(queueName = 'default-queue'): DestinationFactory {
    const factory = new DestinationFactory();
    factory._endpointUrl = 'https://queue-broker.oneinbox.ai/publish';
    factory._destinationType = DestinationType.queue();
    factory._eventFilters = { queueName };
    return factory;
  }

  /**
   * Returns a factory pre-configured for an AUDIT destination.
   */
  public static audit(): DestinationFactory {
    const factory = new DestinationFactory();
    factory._endpointUrl = 'https://audit.oneinbox.ai/log';
    factory._destinationType = DestinationType.audit();
    factory._eventFilters = { retentionDays: 90 };
    return factory;
  }

  /**
   * Sets the enabled state on this factory instance (chainable).
   */
  public enabled(value: boolean): this {
    this._enabled = value;
    return this;
  }

  /**
   * Sets the endpoint URL on this factory instance (chainable).
   */
  public withUrl(url: string): this {
    this._endpointUrl = url;
    return this;
  }

  /**
   * Sets the event filters on this factory instance (chainable).
   */
  public withEventFilters(filters: Record<string, unknown>): this {
    this._eventFilters = filters;
    return this;
  }

  /**
   * Builds and returns the configured Destination entity.
   */
  public build(): Destination {
    const dest = Destination.create({
      endpointUrl: this._endpointUrl,
      destinationType: this._destinationType,
      eventFilters: this._eventFilters,
    });

    if (!this._enabled) {
      dest.disable();
    }

    return dest;
  }
}
