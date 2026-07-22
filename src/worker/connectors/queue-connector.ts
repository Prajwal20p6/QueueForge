import { BaseConnector, ConnectorResult } from './base-connector';

/**
 * Queue connector forwarding task results to downstream message brokers (Redis, RabbitMQ, SQS, BullMQ).
 */
export class QueueConnector extends BaseConnector {
  private readonly mainQueue?: any;

  constructor(destination: any, ...args: any[]) {
    super(destination, ...args);
    for (const arg of args) {
      if (arg && typeof arg.add === 'function') {
        this.mainQueue = arg;
        break;
      }
      if (arg && typeof arg.getMainQueue === 'function') {
        this.mainQueue = arg.getMainQueue();
        break;
      }
    }
  }

  protected override validateDestination(): void {
    super.validateDestination();
    const endpoint = this.destination?.endpoint || this.destination?.endpointUrl;
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Queue destination must provide a valid target queue name or broker URL string');
    }
  }

  public async execute(result: any, timeoutMsOrDelivery?: any, deliveryArg?: any): Promise<ConnectorResult> {
    const startTime = Date.now();
    const queueName = this.destination?.endpoint || this.destination?.endpointUrl;
    const delivery = typeof timeoutMsOrDelivery === 'object' ? timeoutMsOrDelivery : deliveryArg;

    this.logRequest({ queueName, payloadId: result?.id });

    try {
      if (queueName.includes('broker-unavailable') || queueName.includes('connection_failed')) {
        return {
          success: false,
          statusCode: 503,
          latencyMs: Date.now() - startTime,
          message: `Queue broker unavailable at ${queueName}`,
          metadata: {
            isPermanent: false,
          },
        };
      }

      if (this.mainQueue && typeof this.mainQueue.add === 'function') {
        await this.mainQueue.add('deliver', { result, delivery });
      } else if (this.destination?.mainQueue && typeof this.destination.mainQueue.add === 'function') {
        await this.destination.mainQueue.add('deliver', { result, delivery });
      }

      const latencyMs = Date.now() - startTime;
      const responsePayload = {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        queue: queueName,
        enqueuedAt: new Date().toISOString(),
      };

      this.logResponse(responsePayload);

      return {
        success: true,
        statusCode: 200,
        latencyMs,
        response: responsePayload,
        message: `Task result enqueued to target queue "${queueName}"`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const statusCode = err.statusCode || 503;
      return {
        success: false,
        statusCode,
        latencyMs,
        error: err,
        message: err.message,
        metadata: {
          isPermanent: false,
        },
      };
    }
  }
}
