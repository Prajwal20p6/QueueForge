import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class ValidationError extends DomainError {
  public readonly field?: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, errorsOrContext?: Record<string, any> | any[] | string) {
    const isStringParam = typeof errorsOrContext === 'string';
    const msg = isStringParam ? `Validation error on ${message}: ${errorsOrContext}` : message;
    const ctx = isStringParam ? { field: message } : (typeof errorsOrContext === 'object' ? { errors: errorsOrContext } : undefined);

    super(msg, ErrorCode.VALIDATION_FAILED, 422, ctx);

    if (isStringParam) {
      this.field = message;
      this.details = { field: message };
    }

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  public getCode(): string {
    return this.code;
  }

  public getField(): string | undefined {
    return this.field;
  }

  public getDetails(): Record<string, any> | undefined {
    return this.details;
  }
}
