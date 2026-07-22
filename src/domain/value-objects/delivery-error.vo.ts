import { DomainError } from '../errors/domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { ValidationError } from '../../shared/errors/validation-error';

export enum DeliveryErrorCategory {
  TRANSIENT = 'TRANSIENT',
  PERMANENT = 'PERMANENT',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Immutable Value Object representing an error that occurred during destination delivery attempt.
 */
export class DeliveryError extends DomainError {
  public readonly category: DeliveryErrorCategory;
  public override readonly message: string;
  public override readonly statusCode: any;
  public readonly deliveryId: string | null;

  constructor(
    categoryOrDeliveryId: DeliveryErrorCategory | string,
    message: string,
    statusCodeOrRetryable?: number | boolean | null,
    statusCode?: number | null
  ) {
    if (!message || typeof message !== 'string') {
      throw new ValidationError('DeliveryError message must be a non-empty string.');
    }

    let cat: DeliveryErrorCategory;
    let delId: string | null = null;
    let codeNum: number | null = null;

    if (typeof statusCodeOrRetryable === 'boolean') {
      delId = String(categoryOrDeliveryId);
      cat = statusCodeOrRetryable ? DeliveryErrorCategory.TRANSIENT : DeliveryErrorCategory.PERMANENT;
      codeNum = statusCode ?? null;
    } else {
      const stringCat = String(categoryOrDeliveryId).toUpperCase();

      if (stringCat === 'TRANSIENT') cat = DeliveryErrorCategory.TRANSIENT;
      else if (stringCat === 'PERMANENT') cat = DeliveryErrorCategory.PERMANENT;
      else if (stringCat === 'NETWORK') cat = DeliveryErrorCategory.NETWORK;
      else if (stringCat === 'TIMEOUT') cat = DeliveryErrorCategory.TIMEOUT;
      else if (stringCat === 'SERVER') cat = DeliveryErrorCategory.SERVER;
      else cat = DeliveryErrorCategory.UNKNOWN;

      delId = null;
      codeNum = typeof statusCodeOrRetryable === 'number' ? statusCodeOrRetryable : null;
    }

    super(message, ErrorCode.DELIVERY_FAILED, codeNum || 400, { category: cat, deliveryId: delId });

    this.message = message;
    this.category = cat;
    this.deliveryId = delId;
    this.statusCode = codeNum;

    Object.setPrototypeOf(this, DeliveryError.prototype);
  }

  public getCategory(): DeliveryErrorCategory {
    return this.category;
  }

  public getMessage(): string {
    return this.message;
  }

  public getStatusCode(): number | null {
    return this.statusCode;
  }

  public getDeliveryId(): string {
    return this.deliveryId || '';
  }

  /**
   * Evaluates whether the failure category is retryable.
   */
  public isRetryable(): boolean {
    return (
      this.category === DeliveryErrorCategory.TRANSIENT ||
      this.category === DeliveryErrorCategory.NETWORK ||
      this.category === DeliveryErrorCategory.TIMEOUT ||
      this.category === DeliveryErrorCategory.SERVER
    );
  }

  /**
   * Compares value equality with another DeliveryError instance.
   */
  public equals(other: DeliveryError): boolean {
    if (!other || !(other instanceof DeliveryError)) {
      return false;
    }
    return (
      this.category === other.category &&
      this.message === other.message &&
      this.statusCode === other.statusCode
    );
  }

  /**
   * Serializes error to string format.
   */
  public override toString(): string {
    return `[${this.category}] ${this.statusCode ? `(HTTP ${this.statusCode}) ` : ''}${this.message}`;
  }

  /**
   * Static factory classifying HTTP status codes into DeliveryError categories.
   */
  public static fromStatusCode(statusCode: number, message?: string): DeliveryError {
    const defaultMsg = message || `HTTP Status Code ${statusCode}`;

    if (statusCode === 408 || statusCode === 429) {
      return new DeliveryError(DeliveryErrorCategory.TRANSIENT, defaultMsg, statusCode);
    }
    if (statusCode >= 400 && statusCode < 500) {
      return new DeliveryError(DeliveryErrorCategory.PERMANENT, defaultMsg, statusCode);
    }
    if (statusCode >= 500 && statusCode < 600) {
      return new DeliveryError(DeliveryErrorCategory.SERVER, defaultMsg, statusCode);
    }

    return new DeliveryError(DeliveryErrorCategory.UNKNOWN, defaultMsg, statusCode);
  }

  /**
   * Static factory classifying JavaScript Exception objects into DeliveryError categories.
   */
  public static fromException(error: Error | any): DeliveryError {
    const msg = error?.message || String(error);
    const code = error?.code || '';

    if (code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET') || msg.includes('network')) {
      return new DeliveryError(DeliveryErrorCategory.NETWORK, msg);
    }
    if (code === 'ETIMEDOUT' || msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
      return new DeliveryError(DeliveryErrorCategory.TIMEOUT, msg);
    }

    return new DeliveryError(DeliveryErrorCategory.UNKNOWN, msg);
  }
}
