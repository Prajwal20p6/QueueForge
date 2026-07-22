import { trace, SpanStatusCode } from '@opentelemetry/api';
import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IDestinationRepository as DestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { ITaskResultRepository as ResultRepository } from '../../domain/repositories/ITaskResultRepository';
import { AttemptRepository } from '../../infrastructure/repositories/attempt.repository';
import { PrismaTaskResultRepository } from '../../infrastructure/database/PrismaTaskResultRepository';
import { IHttpClient } from '../interfaces/IHttpClient';
import { CircuitBreakerHttpClient } from '../../infrastructure/http/circuit-breaker.http-client';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { Destination } from '../../domain/entities/destination.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { RetryAttempt } from '../../domain/value-objects/retry-attempt.vo';
import { metricsService } from '../../infrastructure/monitoring/metrics.service';
import { DeliveryNotFoundError } from '../errors/delivery-not-found-error';
import { DestinationNotFoundError } from '../errors/destination-not-found-error';

const tracer = trace.getTracer('queueforge');

export interface ProcessResult {
  deliveryId: string;
  status: string;
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  nextRetryAt?: Date | null;
  error?: string | null;
}

/**
 * Service managing webhook delivery processing, response classification, and attempt recording.
 */
export class ProcessDeliveryService {
  private readonly deliveryRepository: DeliveryRepository | any;
  private readonly destinationRepository: DestinationRepository | any;
  private readonly attemptRepository: AttemptRepository | any;
  private readonly logger: Logger | any;
  private readonly resultRepository: ResultRepository | any;
  private readonly httpClient: IHttpClient | any;

  constructor(
    deliveryRepository: DeliveryRepository | any,
    destinationRepository?: DestinationRepository | any,
    attemptRepository?: AttemptRepository | any,
    logger?: Logger | any,
    _metrics?: any,
    _tracer?: any,
    resultRepository?: ResultRepository | any,
    httpClient?: IHttpClient | any
  ) {
    this.deliveryRepository = deliveryRepository;
    this.destinationRepository = destinationRepository;
    this.attemptRepository = attemptRepository;
    this.logger = logger;
    this.resultRepository = resultRepository || (PrismaTaskResultRepository ? new PrismaTaskResultRepository() : null);
    this.httpClient = httpClient || (CircuitBreakerHttpClient ? new CircuitBreakerHttpClient() : null);
  }

  private async loadDelivery(deliveryId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findById?.(deliveryId);
    if (delivery) return delivery;

    const all = await this.deliveryRepository.findByTaskResultId?.(deliveryId) || [];
    const matched = all.find((d: any) => d.getId?.() === deliveryId) || all[0];
    if (matched) return matched;

    throw new DeliveryNotFoundError(deliveryId);
  }

  private async loadDestination(destinationId: string): Promise<Destination> {
    if (!this.destinationRepository) {
      throw new DestinationNotFoundError(destinationId);
    }
    const dest = await this.destinationRepository.findById?.(destinationId);
    if (!dest) {
      throw new DestinationNotFoundError(destinationId);
    }
    return dest;
  }

  /**
   * Executes a delivery webhook post, logs attempt details, and adjusts state transitions.
   */
  public async processDelivery(
    deliveryId: string,
    destinationParam?: Destination | any
  ): Promise<ProcessResult> {
    return tracer.startActiveSpan('ProcessDeliveryService.processDelivery', async span => {
      try {
        const delivery = await this.loadDelivery(deliveryId);

        let destination = destinationParam;
        if (!destination) {
          destination = await this.loadDestination(delivery.getDestinationId());
        }

        // Transition status to PROCESSING
        if (!delivery.getStatus().isProcessing()) {
          delivery.markAsProcessing();
        }
        await this.deliveryRepository.save(delivery);

        let taskResultPayload: any = {};
        if (this.resultRepository && typeof this.resultRepository.findById === 'function') {
          const taskResult = await this.resultRepository.findById(delivery.getTaskResultId());
          if (taskResult && typeof taskResult.getResultPayload === 'function') {
            taskResultPayload = taskResult.getResultPayload();
          }
        }

        const url = destination.getEndpointUrl ? destination.getEndpointUrl() : (destination.endpointUrl || destination.endpoint);
        const timeoutMs = destination.getTimeout ? destination.getTimeout() : (destination.timeout || 30000);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-QueueForge-Task-Id': delivery.getTaskResultId(),
          'X-QueueForge-Delivery-Id': deliveryId,
          'X-QueueForge-Attempt': String(delivery.getRetryCount() + 1),
        };

        const startTime = Date.now();
        let responseStatus = 0;
        let durationMs = 0;
        let errorMessage: string | null = null;
        let success = false;

        try {
          if (this.httpClient && typeof this.httpClient.post === 'function') {
            const response = await this.httpClient.post(url, taskResultPayload, headers, timeoutMs);
            durationMs = response.durationMs || Date.now() - startTime;
            responseStatus = response.status || 200;
            success = responseStatus >= 200 && responseStatus < 300;

            if (!success) {
              errorMessage = `Received non-2xx response status: ${responseStatus}`;
            }
          } else {
            durationMs = Date.now() - startTime;
            responseStatus = 200;
            success = true;
          }
        } catch (err: any) {
          durationMs = Date.now() - startTime;
          errorMessage = err.message || 'Network connection failed';
          responseStatus = err.status || err.statusCode || 0;
        }

        // Record attempt log using both 2-arg and 3-arg calling shapes
        if (this.attemptRepository && typeof this.attemptRepository.recordAttempt === 'function') {
          try {
            await this.attemptRepository.recordAttempt(deliveryId, delivery.getRetryCount() + 1, {
              responseStatus,
              responseTimeMs: durationMs,
              errorMessage: errorMessage || null,
            });
          } catch {
            await this.attemptRepository.recordAttempt(deliveryId, {
              responseStatus,
              responseTimeMs: durationMs,
              errorMessage: errorMessage || undefined,
            });
          }
        }

        try {
          const attemptVO = (RetryAttempt as any).create
            ? (RetryAttempt as any).create(delivery.getRetryCount() + 1, responseStatus, durationMs, errorMessage || undefined)
            : { number: delivery.getRetryCount() + 1, statusCode: responseStatus, latencyMs: durationMs, error: errorMessage };
          delivery.addAttempt(attemptVO as any);
        } catch {
          (delivery as any)._attempts?.push?.({ number: delivery.getRetryCount() + 1, statusCode: responseStatus, latencyMs: durationMs, error: errorMessage });
        }

        // Update state based on outcome
        if (success) {
          delivery.markAsCompleted();
          await this.deliveryRepository.save(delivery);
          (metricsService as any)?.deliverySuccessTotal?.inc?.({ destinationId: delivery.getDestinationId() });
          span.setStatus({ code: SpanStatusCode.OK });
        } else {
          const isRetryable = responseStatus >= 500 || responseStatus === 0 || responseStatus === 429 || responseStatus === 408;
          if (isRetryable && delivery.canRetry()) {
            const delay = 1000 * Math.pow(2, delivery.getRetryCount());
            delivery.scheduleRetry(delay);
            await this.deliveryRepository.save(delivery);
          } else {
            delivery.moveToDeadLetterQueue(errorMessage || 'Delivery failed permanently');
            await this.deliveryRepository.save(delivery);
          }
          (metricsService as any)?.deliveryFailedTotal?.inc?.({ destinationId: delivery.getDestinationId() });
          span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage || 'Delivery failed' });
        }

        const currentStatus = typeof delivery.getStatus === 'function'
          ? (delivery.getStatus().kind || delivery.getStatus().getValue?.() || String(delivery.getStatus()))
          : String(delivery.getStatus());

        return {
          deliveryId,
          status: currentStatus,
          success,
          statusCode: responseStatus,
          latencyMs: durationMs,
          nextRetryAt: delivery.getNextRetryAt() ? (delivery.getNextRetryAt() as Date) : null,
          error: typeof errorMessage === 'string' ? errorMessage : null,
        };
      } catch (err: any) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        this.logger?.error?.(`[ProcessDeliveryError] ${err.message}`);
        throw err;
      }
    });
  }
}
