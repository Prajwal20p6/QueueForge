export type ErrorCategory =
  | 'TRANSIENT'
  | 'PERMANENT'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN';

export interface ClassificationResult {
  category: ErrorCategory;
  retryable: boolean;
  isRetryable: boolean;
  durationMs?: number;
}

/**
 * Classifies runtime exceptions and HTTP status codes into structured retryability and failure category models.
 */
export class ErrorClassifier {
  constructor(..._args: any[]) {}

  /**
   * Classifies error object and optional HTTP status code into structured outcome details.
   */
  public classify(error: Error | any, statusCode?: number): ClassificationResult {
    const code = statusCode || error?.statusCode || error?.status || error?.response?.status;
    const category = this.getCategory(error, code);
    const retryable = this.getRetryable(error, code);

    return {
      category,
      retryable,
      isRetryable: retryable,
    };
  }

  public classifyHttpStatus(statusCode: number): ClassificationResult {
    return this.classify(new Error(`HTTP ${statusCode}`), statusCode);
  }

  /**
   * Determines whether an error is transient and suitable for retry attempts.
   */
  public getRetryable(error: Error | any, statusCode?: number): boolean {
    const category = this.getCategory(error, statusCode);
    return category === 'TRANSIENT' || category === 'NETWORK' || category === 'TIMEOUT' || category === 'SERVER' || category === 'UNKNOWN';
  }

  /**
   * Evaluates exact ErrorCategory classification based on status code and error signatures.
   */
  public getCategory(error: Error | any, statusCode?: number): ErrorCategory {
    const code = statusCode || error?.statusCode || error?.status || error?.response?.status;

    if (typeof code === 'number') {
      if (code === 408) {
        return 'TIMEOUT';
      }
      if (code === 429 || code >= 500) {
        return 'TRANSIENT';
      }
      if (code >= 400 && code < 500) {
        if (code === 422 || code === 400) return 'VALIDATION';
        return 'PERMANENT';
      }
    }

    const msg = String(error?.message || error || '').toLowerCase();
    if (msg.includes('validation')) {
      return 'VALIDATION';
    }

    const errCode = String(error?.code || '').toUpperCase();
    if (['ECONNREFUSED', 'ENOTFOUND', 'EPIPE', 'EHOSTUNREACH', 'EAI_AGAIN'].includes(errCode)) {
      return 'NETWORK';
    }

    if (errCode === 'ETIMEDOUT' || error?.name === 'TimeoutError' || msg.includes('timeout')) {
      return 'TIMEOUT';
    }

    if (error?.name === 'ValidationError' || error?.code === 'VALIDATION_FAILED') {
      return 'VALIDATION';
    }

    if (msg.includes('connection refused') || msg.includes('network') || msg.includes('socket hang up') || msg.includes('reset')) {
      return 'NETWORK';
    }

    return 'UNKNOWN';
  }
}
