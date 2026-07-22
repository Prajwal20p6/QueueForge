import { trace, SpanStatusCode } from '@opentelemetry/api';
import { ITaskResultRepository as ResultRepository } from '../../domain/repositories/ITaskResultRepository';
import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IDestinationRepository as DestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { IQueueService as Queue } from '../interfaces/IQueueService';
import { IdempotencyCache } from '../../infrastructure/cache/idempotency-cache';
import { AuditContext, AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { IngestResultRequest, IngestResultResponse } from '../dto/ingestion.dto';
import { ResultMapper } from '../mappers/result-mapper';
import { Delivery } from '../../domain/entities/delivery.entity';
import { ValidateResultService } from './validate-result.service';
import { metricsService } from '../../infrastructure/monitoring/metrics.service';

const tracer = trace.getTracer('queueforge');

/**
 * Service orchestrating AI result validations, transactions database persistence, matching routes checks, and job enqueuing.
 */
export class IngestResultService {
  constructor(
    private readonly resultRepository: ResultRepository | any,
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly destinationRepository: DestinationRepository | any,
    private readonly queue: Queue | any,
    private readonly cache: IdempotencyCache | any,
    private readonly logger: Logger | any
  ) {}

  /**
   * Asserts validity, checks cache duplicates, persists matching routes, enqueues jobs, and returns status details.
   */
  public async ingest(request: IngestResultRequest, context?: AuditContext): Promise<IngestResultResponse> {
    return tracer.startActiveSpan('IngestResultService.ingest', async span => {
      try {
        // 1. Validate payload using the validation service
        const validator = new ValidateResultService(this.logger);
        await validator.validate(request);

        // 2. Check Idempotency Cache
        const idempotencyKey = `idem:result:${request.emailId}:${request.agentId}:${request.agentVersion}`;
        if (this.cache && typeof this.cache.get === 'function') {
          const cached = await this.cache.get(idempotencyKey);
          if (cached) {
            this.logger?.info?.(`[Idempotency] Duplicate ingestion bypassed for key: "${idempotencyKey}"`);
            metricsService?.incomingResultsTotal?.inc?.({ status: 'duplicate' });
            span.setAttribute('idempotency.hit', true);

            const deliveryCount = cached.value?.deliveryCount ?? cached.value?.destinationCount ?? 0;
            const queuedDate = cached.value?.timestamp ? new Date(cached.value.timestamp) : (cached.value?.queuedAt ? new Date(cached.value.queuedAt) : new Date());

            return {
              resultId: cached.value.resultId,
              status: 'accepted' as const,
              deliveryCount,
              destinationCount: deliveryCount,
              timestamp: queuedDate,
              queuedAt: queuedDate,
            };
          }
        }

        // 3. Map to AiTaskResult domain entity
        const taskResult = ResultMapper.toDomain(request);
        const resultId = taskResult.getId();

        // 4. Find matching destinations
        const activeDestinations = this.destinationRepository?.findAllActive
          ? await this.destinationRepository.findAllActive()
          : (this.destinationRepository?.findAll ? await this.destinationRepository.findAll() : []);

        const matched = activeDestinations.filter((dest: any) => {
          if (typeof dest.matches === 'function') {
            return dest.matches({
              emailId: taskResult.getEmailId(),
              agentId: taskResult.getAgentId(),
              confidenceScore: taskResult.getConfidenceScore(),
              ...taskResult.getResultPayload(),
            });
          }
          if (typeof dest.matchesEventFilter === 'function') {
            return dest.matchesEventFilter(taskResult.getResultPayload());
          }
          return true;
        });

        // 5. Create delivery entity for each matched route
        const deliveries = matched.map((dest: any) =>
          Delivery.create(resultId, dest.getId ? dest.getId() : dest.id)
        );

        // 6. Database Persistence
        if (this.resultRepository) {
          if (typeof this.resultRepository.save === 'function') {
            await this.resultRepository.save(taskResult);
          } else if (typeof this.resultRepository.createResult === 'function') {
            const dto = ResultMapper.toDTO(taskResult);
            await this.resultRepository.createResult(dto);
          } else if (typeof this.resultRepository.create === 'function') {
            const dto = ResultMapper.toDTO(taskResult);
            await this.resultRepository.create(dto);
          }
        }
        if (this.deliveryRepository) {
          for (const delivery of deliveries) {
            if (typeof this.deliveryRepository.save === 'function') {
              await this.deliveryRepository.save(delivery);
            } else if (typeof this.deliveryRepository.create === 'function') {
              await this.deliveryRepository.create({
                id: delivery.getId(),
                taskResultId: delivery.getTaskResultId(),
                destinationId: delivery.getDestinationId(),
                status: delivery.getStatus().getValue(),
                retryCount: delivery.getRetryCount(),
                nextRetryAt: delivery.getNextRetryAt(),
                createdAt: delivery.getCreatedAt(),
                updatedAt: delivery.getUpdatedAt(),
              });
            }
          }
        }

        // 7. Enqueue delivery jobs to main queue
        if (this.queue) {
          for (const delivery of deliveries) {
            if (typeof this.queue.enqueueDelivery === 'function') {
              await this.queue.enqueueDelivery(resultId, delivery.getDestinationId(), 1);
            } else if (typeof this.queue.add === 'function') {
              await this.queue.add('deliver-task-result', { deliveryId: delivery.getId() });
            }
          }
        }

        // 8. Record to Idempotency Cache
        const now = new Date();
        const responseData: IngestResultResponse = {
          resultId,
          status: 'accepted' as const,
          deliveryCount: matched.length,
          destinationCount: matched.length,
          timestamp: now,
          queuedAt: now,
        };

        if (this.cache && typeof this.cache.set === 'function') {
          await this.cache.set(idempotencyKey, responseData, 24); // Cache for 24 hours
        }

        // 9. Metrics & Logging
        metricsService?.incomingResultsTotal?.inc?.({ status: 'accepted' });
        span.setAttribute('destination.matched_count', matched.length);
        span.setStatus({ code: SpanStatusCode.OK });

        this.logger?.info?.(`[IngestSuccess] Ingested task result "${resultId}" enqueued to ${matched.length} destinations.`);
        return responseData;
      } catch (err: any) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        this.logger?.error?.(`[IngestError] Ingestion failed: ${err.message}`, { context });
        throw err;
      }
    });
  }
}
