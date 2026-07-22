import { v4 as uuidv4 } from 'uuid';
import { DeliveryStatus, DeliveryStatusVO } from '../value-objects/delivery-status.vo';
import { DeliveryError } from '../value-objects/delivery-error.vo';
import { RetryAttempt } from '../value-objects/retry-attempt.vo';
import { RetryStrategyVO } from '../value-objects/retry-strategy.vo';
import { InvalidDeliveryStateError } from '../errors/invalid-delivery-state-error';
import { ValidationError } from '../../shared/errors/validation-error';
import { AggregateRoot } from '../types/aggregates.types';

/**
 * Domain Entity representing a single result delivery lifecycle to a single target destination.
 */
export class Delivery extends AggregateRoot {
  private readonly _taskResultId: string;
  private readonly _destinationId: string;
  private _status: DeliveryStatusVO;
  private _retryCount: number;
  private _nextRetryAt: Date | null;
  private _lastAttemptAt: Date | null;
  private _lastError: DeliveryError | null;
  private _completedAt: Date | null;
  private _updatedAt: Date;
  private readonly _attempts: RetryAttempt[];

  constructor(
    id: string,
    taskResultId: string,
    destinationId: string,
    status: DeliveryStatusVO,
    retryCount = 0,
    nextRetryAt: Date | null = null,
    lastAttemptAt: Date | null = null,
    lastError: DeliveryError | null = null,
    completedAt: Date | null = null,
    createdAt?: Date,
    updatedAt?: Date,
    attempts: RetryAttempt[] = [],
    deletedAt: Date | null = null
  ) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Delivery ID must be a non-empty string.');
    }
    if (!taskResultId || typeof taskResultId !== 'string') {
      throw new ValidationError('Delivery taskResultId must be a non-empty string.');
    }
    if (!destinationId || typeof destinationId !== 'string') {
      throw new ValidationError('Delivery destinationId must be a non-empty string.');
    }
    if (!status || !(status instanceof DeliveryStatusVO)) {
      throw new ValidationError('Delivery status must be a valid DeliveryStatusVO value object.');
    }

    super(id, createdAt ? new Date(createdAt) : new Date(), deletedAt);
    this._taskResultId = taskResultId;
    this._destinationId = destinationId;
    this._status = status;
    this._retryCount = retryCount;
    this._nextRetryAt = nextRetryAt ? new Date(nextRetryAt) : null;
    this._lastAttemptAt = lastAttemptAt ? new Date(lastAttemptAt) : null;
    this._lastError = lastError;
    this._completedAt = completedAt ? new Date(completedAt) : null;
    this._updatedAt = updatedAt ? new Date(updatedAt) : new Date(this.createdAt);
    this._attempts = [...attempts];
  }

  public getTaskResultId(): string {
    return this._taskResultId;
  }

  public getDestinationId(): string {
    return this._destinationId;
  }

  public getStatus(): DeliveryStatusVO {
    return this._status;
  }

  public getRetryCount(): number {
    return this._retryCount;
  }

  public getNextRetryAt(): Date | null {
    return this._nextRetryAt ? new Date(this._nextRetryAt) : null;
  }

  public getLastAttemptAt(): Date | null {
    return this._lastAttemptAt ? new Date(this._lastAttemptAt) : null;
  }

  public getLastError(): DeliveryError | null {
    return this._lastError;
  }

  public getCompletedAt(): Date | null {
    return this._completedAt ? new Date(this._completedAt) : null;
  }

  public getUpdatedAt(): Date {
    return new Date(this._updatedAt);
  }

  public getAttempts(): RetryAttempt[] {
    return [...this._attempts];
  }

  /**
   * Transitions delivery state to PROCESSING.
   * Allowed from: PENDING, SCHEDULED_RETRY.
   */
  public markAsProcessing(): void {
    if (!this._status.isPending() && !this._status.isScheduledForRetry()) {
      throw new InvalidDeliveryStateError(this._status.getValue(), DeliveryStatus.PROCESSING);
    }
    this._status = DeliveryStatusVO.create(DeliveryStatus.PROCESSING);
    this._lastAttemptAt = new Date();
    this._updatedAt = new Date();
  }

  public markProcessing(): void {
    this.markAsProcessing();
  }

  /**
   * Transitions delivery state to COMPLETED.
   * Allowed from: PROCESSING.
   */
  public markAsCompleted(_completedAt?: Date | number, _latencyMs?: number): void {
    if (!this._status.isProcessing()) {
      throw new InvalidDeliveryStateError(this._status.getValue(), DeliveryStatus.COMPLETED);
    }
    const now = typeof _completedAt === 'number' ? new Date(_completedAt) : (_completedAt ? new Date(_completedAt) : new Date());
    this._status = DeliveryStatusVO.create(DeliveryStatus.COMPLETED);
    this._completedAt = now;
    this._nextRetryAt = null;
    this._updatedAt = now;
  }

  public markCompleted(_completedAt?: Date | number, _latencyMs?: number): void {
    this.markAsCompleted(_completedAt, _latencyMs);
  }

  /**
   * Transitions delivery state following a failure attempt.
   */
  public markAsFailed(error: DeliveryError | any, retryStrategy?: RetryStrategyVO | boolean, maxRetries = 5): void {
    if (!this._status.isProcessing()) {
      throw new InvalidDeliveryStateError(this._status.getValue(), DeliveryStatus.SCHEDULED_RETRY);
    }

    const errObj = error instanceof DeliveryError
      ? error
      : new DeliveryError('UNKNOWN', typeof error === 'string' ? error : (error?.message || 'Delivery failed'));

    this._lastError = errObj;
    this._retryCount += 1;

    const shouldDLQ = !errObj.isRetryable() || this._retryCount >= maxRetries;

    if (shouldDLQ) {
      this.moveToDeadLetterQueue(errObj.getMessage());
    } else if (retryStrategy && typeof retryStrategy === 'object') {
      this.moveToRetry(retryStrategy as RetryStrategyVO);
    } else {
      this.scheduleRetry(1000 * Math.pow(2, this._retryCount));
    }
  }

  public incrementRetryCount(): void {
    this._retryCount += 1;
    this._updatedAt = new Date();
  }

  public markFailed(error?: any, retryStrategy?: RetryStrategyVO | boolean, maxRetries = 5): void {
    const errObj = error instanceof DeliveryError
      ? error
      : new DeliveryError('UNKNOWN', typeof error === 'string' ? error : (error?.message || 'Delivery failed'));

    this._lastError = errObj;
    if (this._retryCount === 0) {
      this._retryCount = 1;
    }

    const isRetry = typeof retryStrategy === 'boolean' ? retryStrategy : (retryStrategy ? retryStrategy.canRetry(this._retryCount) : true);
    if (!isRetry || this._retryCount >= maxRetries) {
      this.moveToDeadLetterQueue(errObj.getMessage());
    } else {
      this._status = DeliveryStatusVO.create(DeliveryStatus.SCHEDULED_RETRY);
      this._updatedAt = new Date();
    }
  }

  /**
   * Schedules a retry with specified delay in milliseconds or explicit Date.
   */
  public scheduleRetry(delay: number | Date): void {
    this._status = DeliveryStatusVO.create(DeliveryStatus.SCHEDULED_RETRY);
    this._nextRetryAt = typeof delay === 'number' ? new Date(Date.now() + Math.max(0, delay)) : new Date(delay);
    this._updatedAt = new Date();
  }

  /**
   * Calculates next retry schedule using RetryStrategyVO.
   */
  public moveToRetry(retryStrategy: RetryStrategyVO): void {
    const delayMs = retryStrategy.calculateDelay(this._retryCount);
    this.scheduleRetry(delayMs);
  }

  /**
   * Transitions delivery state to FAILED_DLQ (Dead Letter Queue).
   */
  public moveToDeadLetterQueue(reason: string): void {
    this._status = DeliveryStatusVO.create(DeliveryStatus.FAILED_DLQ);
    if (!this._lastError) {
      this._lastError = new DeliveryError('PERMANENT', reason);
    }
    this._nextRetryAt = null;
    this._updatedAt = new Date();
  }

  public moveToDLQ(reason: string): void {
    this.moveToDeadLetterQueue(reason);
  }

  /**
   * Appends an attempt execution record.
   */
  public addAttempt(attempt: RetryAttempt): void {
    if (!attempt || !(attempt instanceof RetryAttempt)) {
      throw new ValidationError('Attempt must be a valid RetryAttempt instance.');
    }
    this._attempts.push(attempt);
    this._lastAttemptAt = attempt.getTimestamp();
    this._updatedAt = new Date();
  }

  /**
   * Evaluates if delivery is eligible for further retry attempts.
   */
  public canRetry(maxRetries = 5): boolean {
    if (this._status.isFinal()) {
      return false;
    }
    return this._retryCount < maxRetries;
  }

  /**
   * Evaluates if given HTTP status code mandates immediate Dead Letter Queue routing.
   */
  public shouldMoveToDeadLetterQueue(statusCode: number): boolean {
    return statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429;
  }

  /**
   * Compares identity equality with another Delivery entity.
   */
  public override equals(other: any): boolean {
    if (!other || !(other instanceof Delivery)) {
      return false;
    }
    return this.id === other.id;
  }

  /**
   * Static restore method for rehydrating from database / persistence.
   */
  public static restore(params: {
    id: string;
    taskResultId: string;
    destinationId: string;
    status: DeliveryStatusVO | string | { kind?: string; value?: string } | any;
    retryCount?: number;
    nextRetryAt?: Date | null;
    lastAttemptAt?: Date | null;
    lastError?: DeliveryError | any | null;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt?: Date;
    attempts?: RetryAttempt[] | any[];
    deletedAt?: Date | null;
  }): Delivery {
    const rawStatus = typeof params.status === 'object' && params.status !== null && !(params.status instanceof DeliveryStatusVO)
      ? (params.status.kind || params.status.value || params.status)
      : params.status;
    const statusObj = rawStatus instanceof DeliveryStatusVO ? rawStatus : DeliveryStatusVO.create(rawStatus);
    const errObj = params.lastError
      ? (params.lastError instanceof DeliveryError
        ? params.lastError
        : new DeliveryError(params.lastError.category || 'UNKNOWN', params.lastError.message || String(params.lastError), params.lastError.statusCode))
      : null;

    const attemptsObj = (params.attempts || []).map((att: any) =>
      att instanceof RetryAttempt
        ? att
        : new RetryAttempt(att.number || att.attemptNumber || 1, att.statusCode, att.error, att.latencyMs, att.timestamp)
    );

    return new Delivery(
      params.id,
      params.taskResultId,
      params.destinationId,
      statusObj,
      params.retryCount ?? 0,
      params.nextRetryAt || null,
      params.lastAttemptAt || null,
      errObj,
      params.completedAt || null,
      params.createdAt,
      params.updatedAt,
      attemptsObj,
      params.deletedAt || null
    );
  }

  /**
   * Factory method for creating a new Delivery entity instance.
   */
  public static create(taskResultId: string, destinationId: string, id?: string): Delivery {
    const entityId = id || uuidv4();
    const now = new Date();
    return new Delivery(
      entityId,
      taskResultId,
      destinationId,
      DeliveryStatusVO.create(DeliveryStatus.PENDING),
      0,
      null,
      null,
      null,
      null,
      now,
      now,
      []
    );
  }
}
