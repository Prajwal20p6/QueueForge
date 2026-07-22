import { BaseConnector } from './base-connector';
import { WebhookConnector } from './webhook-connector';
import { DatabaseConnector } from './database-connector';
import { QueueConnector } from './queue-connector';
import { AuditConnector } from './audit-connector';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Factory instantiating typed destination connectors based on Destination.type or Destination.destinationType.
 */
export class ConnectorFactory {
  private readonly logger?: any;
  private readonly observability?: any;
  private readonly cache = new Map<string, BaseConnector>();

  constructor(...args: any[]) {
    if (args[0]?.info) this.logger = args[0];
    else if (args[3]?.info) this.logger = args[3];

    if (args[1]?.tracer) this.observability = args[1];
    else if (args[4]?.tracer) this.observability = args[4];
  }

  public getConnector(destinationId: string): BaseConnector {
    let conn = this.cache.get(destinationId);
    if (!conn) {
      conn = this.create({ id: destinationId, type: 'WEBHOOK', endpoint: 'http://localhost/webhook' });
    }
    return conn;
  }

  /**
   * Instantiates appropriate destination egress connector.
   */
  public create(destination: any): BaseConnector {
    const conn = ConnectorFactory.createConnector(destination, { logger: this.logger, observability: this.observability });
    if (destination?.id) {
      this.cache.set(destination.id, conn);
    }
    return conn;
  }

  public static createConnector(
    destination: any,
    dependencies?: { logger?: any; observability?: any }
  ): BaseConnector {
    if (!destination) {
      throw new ValidationError('destination', 'Destination object cannot be null or undefined');
    }

    const rawType = destination.destinationType || destination.type || 'WEBHOOK';
    const typeStr = String(rawType).toUpperCase();

    const logger = dependencies?.logger;
    const observability = dependencies?.observability;

    switch (typeStr) {
      case 'WEBHOOK':
        return new WebhookConnector(destination, logger, observability);
      case 'DATABASE':
        return new DatabaseConnector(destination, logger, observability);
      case 'QUEUE':
        return new QueueConnector(destination, logger, observability);
      case 'AUDIT':
        return new AuditConnector(destination, logger, observability);
      default:
        throw new ValidationError('type', `Unsupported destination connector type: "${typeStr}"`);
    }
  }
}
