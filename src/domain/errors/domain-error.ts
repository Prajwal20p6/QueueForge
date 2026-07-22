import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Base class for all Domain Layer business errors.
 */
export class DomainError extends BaseError {
  constructor(
    codeOrMessage: string,
    messageOrCode?: string,
    statusCodeOrContext?: any,
    context?: Record<string, any>
  ) {
    let code: ErrorCode = ErrorCode.UNKNOWN_ERROR;
    let statusCode: HttpStatus = 400;
    let message: string;
    let ctx: Record<string, any> | undefined;

    if (typeof codeOrMessage === 'string' && codeOrMessage === codeOrMessage.toUpperCase()) {
      code = codeOrMessage as any;
      message = messageOrCode || codeOrMessage;
      statusCode = typeof statusCodeOrContext === 'number' ? statusCodeOrContext : 400;
      ctx = typeof statusCodeOrContext === 'object' ? statusCodeOrContext : context;
    } else {
      message = codeOrMessage;
      code = (messageOrCode as any) || ErrorCode.UNKNOWN_ERROR;
      statusCode = typeof statusCodeOrContext === 'number' ? statusCodeOrContext : 400;
      ctx = context;
    }

    super(code, statusCode, message, ctx);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }

  public getCode(): string {
    return String(this.code);
  }

  public getDetails(): Record<string, any> | undefined {
    return this.context;
  }

  /**
   * Serializes domain error to JSON object structure.
   */
  public toJSON(): Record<string, any> {
    const res: Record<string, any> = {
      code: this.code,
      message: this.message,
      details: this.context || {},
    };
    if (this.name !== 'DomainError') {
      res.name = this.name;
    }
    return res;
  }

  /**
   * String representation of the DomainError.
   */
  public toString(): string {
    return `[${this.name}] ${this.code} (${this.statusCode}): ${this.message}`;
  }
}
