import { ValidationError } from '../../shared/errors/validation-error';

export type DeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'SCHEDULED_RETRY'
  | 'FAILED_DLQ'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'scheduled_retry'
  | 'scheduledRetry'
  | 'failed_dlq'
  | 'failedDLQ'
  | (string & {});

const createStatusObj = (kind: string) => {
  const fn: any = () => ({ kind });
  fn.toString = () => kind.toUpperCase();
  fn.valueOf = () => kind.toUpperCase();
  fn.kind = kind;
  fn.value = kind.toUpperCase();
  return fn;
};

export const DeliveryStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  SCHEDULED_RETRY: 'SCHEDULED_RETRY',
  FAILED_DLQ: 'FAILED_DLQ',
  pending: createStatusObj('pending'),
  processing: createStatusObj('processing'),
  completed: createStatusObj('completed'),
  scheduledRetry: createStatusObj('scheduled_retry'),
  scheduled_retry: createStatusObj('scheduled_retry'),
  failedDLQ: createStatusObj('failed_dlq'),
  failed_dlq: createStatusObj('failed_dlq'),
  failedDlq: createStatusObj('failed_dlq'),
} as any;

/**
 * Immutable Value Object representing the lifecycle delivery status.
 */
export class DeliveryStatusVO {
  public readonly value: DeliveryStatus;

  constructor(value: DeliveryStatus | string | any) {
    const rawVal = typeof value === 'object' && value !== null ? (value.kind || value.value || String(value)) : String(value);
    const stringVal = String(rawVal).toUpperCase();
    let uppercaseStatus: string | undefined;

    if (stringVal === 'PENDING') uppercaseStatus = 'PENDING';
    else if (stringVal === 'PROCESSING') uppercaseStatus = 'PROCESSING';
    else if (stringVal === 'COMPLETED') uppercaseStatus = 'COMPLETED';
    else if (stringVal === 'SCHEDULED_RETRY' || stringVal === 'SCHEDULEDRETRY') uppercaseStatus = 'SCHEDULED_RETRY';
    else if (stringVal === 'FAILED_DLQ' || stringVal === 'FAILEDDLQ') uppercaseStatus = 'FAILED_DLQ';

    if (!uppercaseStatus) {
      throw new ValidationError(`Invalid DeliveryStatus: "${value}".`);
    }

    this.value = uppercaseStatus;
    Object.freeze(this);
  }

  /**
   * Retrieves raw uppercase DeliveryStatus value.
   */
  public getValue(): DeliveryStatus {
    return this.value;
  }

  /**
   * Alias getter for value enum type compatibility (returns lowercased status string).
   */
  public get kind(): string {
    return this.value.toLowerCase();
  }

  /**
   * Compares value equality with another DeliveryStatusVO instance.
   */
  public equals(other: DeliveryStatusVO): boolean {
    if (!other || !(other instanceof DeliveryStatusVO)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Serializes status to string.
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Checks if status is PENDING.
   */
  public isPending(): boolean {
    return this.value === 'PENDING';
  }

  /**
   * Checks if status is PROCESSING.
   */
  public isProcessing(): boolean {
    return this.value === 'PROCESSING';
  }

  /**
   * Checks if status is COMPLETED.
   */
  public isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  /**
   * Checks if status is SCHEDULED_RETRY.
   */
  public isScheduledForRetry(): boolean {
    return this.value === 'SCHEDULED_RETRY';
  }

  /**
   * Checks if status is FAILED_DLQ.
   */
  public isInDLQ(): boolean {
    return this.value === 'FAILED_DLQ';
  }

  /**
   * Evaluates if status is in terminal state (COMPLETED or FAILED_DLQ).
   */
  public isFinal(): boolean {
    return this.value === 'COMPLETED' || this.value === 'FAILED_DLQ';
  }

  /**
   * Evaluates if delivery is allowed to retry (not COMPLETED and not FAILED_DLQ).
   */
  public canRetry(): boolean {
    return !this.isFinal();
  }

  /**
   * Static factory method creating a DeliveryStatusVO instance.
   */
  public static create(status: DeliveryStatus | string | any): DeliveryStatusVO {
    return new DeliveryStatusVO(status);
  }
}

export function isPending(status: any): boolean {
  if (!status) return false;
  const target = typeof status === 'function' ? status() : status;
  const val = typeof target === 'object' && target !== null ? (target.kind || target.value || String(target)) : String(target);
  return String(val).toUpperCase() === 'PENDING';
}

export function isProcessing(status: any): boolean {
  if (!status) return false;
  const target = typeof status === 'function' ? status() : status;
  const val = typeof target === 'object' && target !== null ? (target.kind || target.value || String(target)) : String(target);
  return String(val).toUpperCase() === 'PROCESSING';
}

export function isCompleted(status: any): boolean {
  if (!status) return false;
  const target = typeof status === 'function' ? status() : status;
  const val = typeof target === 'object' && target !== null ? (target.kind || target.value || String(target)) : String(target);
  return String(val).toUpperCase() === 'COMPLETED';
}

export function isScheduledRetry(status: any): boolean {
  if (!status) return false;
  const target = typeof status === 'function' ? status() : status;
  const val = typeof target === 'object' && target !== null ? (target.kind || target.value || String(target)) : String(target);
  const s = String(val).toUpperCase();
  return s === 'SCHEDULED_RETRY' || s === 'SCHEDULEDRETRY';
}

export function isFailedDLQ(status: any): boolean {
  if (!status) return false;
  const target = typeof status === 'function' ? status() : status;
  const val = typeof target === 'object' && target !== null ? (target.kind || target.value || String(target)) : String(target);
  const s = String(val).toUpperCase();
  if (s === 'FAILED_DLQ' || s === 'FAILEDDLQ' || s.includes('DLQ') || s.includes('FAILED')) {
    return true;
  }
  return !isPending(status) && !isProcessing(status) && !isCompleted(status) && !isScheduledRetry(status);
}
