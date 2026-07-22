import { createHmac } from 'crypto';
import { ITaskResultRepository } from '../../domain/repositories/ITaskResultRepository';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { IDeliveryLogRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { IHttpClient } from '../interfaces/IHttpClient';
import { Delivery } from '../../domain/entities/delivery.entity';
import { DeliveryStatusVO } from '../../domain/value-objects/delivery-status.vo';

export class DeliverTaskResultUseCase {
  constructor(
    private readonly taskResultRepository: ITaskResultRepository,
    private readonly destinationRepository: IDestinationRepository,
    private readonly deliveryLogRepository: IDeliveryLogRepository,
    private readonly httpClient: IHttpClient
  ) {}

  public async execute(
    taskResultId: string,
    destinationId: string,
    attempt: number,
    maxRetries: number = 5
  ): Promise<void> {
    const taskResult = await this.taskResultRepository.findById(taskResultId);
    if (!taskResult) {
      throw new Error(`TaskResult with ID ${taskResultId} not found`);
    }

    const destination = await this.destinationRepository.findById(destinationId);
    if (!destination) {
      throw new Error(`Destination with ID ${destinationId} not found`);
    }

    if (!destination.isEnabled()) {
      // If destination was deactivated, skip execution
      return;
    }

    if (destination.getDestinationType().kind !== 'webhook') {
      throw new Error(`Unsupported destination type: ${destination.getDestinationType().kind}`);
    }

    const url = destination.getEndpointUrl();
    const filters = destination.getEventFilters() || {};
    const hmacSecret = filters.hmacSecret;
    const customHeaders = (filters.headers as Record<string, string>) ?? {};
    const timeoutMs = Number(filters.timeoutMs ?? 5000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-QueueForge-Task-Id': taskResult.getId(),
      'X-QueueForge-Attempt': attempt.toString(),
      ...customHeaders,
    };

    // Generate HMAC signature if secret exists
    if (hmacSecret) {
      const hmac = createHmac('sha256', hmacSecret);
      hmac.update(JSON.stringify(taskResult.getResultPayload()));
      headers['X-QueueForge-Signature'] = hmac.digest('hex');
    }

    let success = false;
    let responseTime: number | null = null;
    let errorMessage: string | null = null;
    let responseStatus = 0;

    try {
      const response = await this.httpClient.post(
        url,
        taskResult.getResultPayload(),
        headers,
        timeoutMs
      );

      success = response.status >= 200 && response.status < 300;
      responseStatus = response.status;
      responseTime = response.durationMs;
      if (!success) {
        errorMessage = `Received non-2xx status code: ${response.status}`;
      }
    } catch (error: any) {
      success = false;
      errorMessage = error.message || 'Unknown network error';
    }

    // Manage Delivery state machine
    const delivery = Delivery.restore({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : 'del-' + Math.random().toString(36).substr(2, 9),
      taskResultId,
      destinationId,
      status: DeliveryStatusVO.create('PENDING'),
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    delivery.markProcessing();
    delivery.incrementRetryCount();

    if (success) {
      delivery.markCompleted(responseStatus, responseTime ?? 0);
    } else {
      const err = new Error(errorMessage || 'Delivery failed');
      delivery.markFailed(err, attempt < maxRetries);

      if (attempt >= maxRetries) {
        delivery.moveToDLQ(errorMessage || 'Max retries reached');
      } else {
        const nextRetryDate = new Date(Date.now() + 5000);
        delivery.scheduleRetry(nextRetryDate);
      }
    }

    await this.deliveryLogRepository.save(delivery);

    if (!success) {
      if (attempt >= maxRetries) {
        throw new Error(
          `Delivery failed to destination ${destinationId} after ${attempt} attempts. Permanent failure (DLQ). Error: ${errorMessage}`
        );
      } else {
        throw new Error(`Delivery attempt ${attempt} failed. Error: ${errorMessage}`);
      }
    }
  }
}
