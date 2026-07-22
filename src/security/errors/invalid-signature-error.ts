import { SecurityError } from './security-error';

export type InvalidSignatureReason = 'missing_signature' | 'invalid_signature' | 'expired_request' | 'malformed_header';

/**
 * Exception thrown when HMAC webhook signatures fail cryptographic verification or timestamp expiry limits.
 */
export class InvalidSignatureError extends SecurityError {
  public readonly reason: InvalidSignatureReason;

  constructor(reason: InvalidSignatureReason | string = 'invalid_signature') {
    const reasonStr = typeof reason === 'string' ? reason : 'invalid_signature';
    const message = `HMAC Webhook Signature verification failed: ${reasonStr}`;
    super(message, 401, { reason: reasonStr });
    this.name = 'InvalidSignatureError';
    this.reason = (['missing_signature', 'invalid_signature', 'expired_request', 'malformed_header'].includes(reasonStr)
      ? reasonStr
      : 'invalid_signature') as InvalidSignatureReason;
    Object.setPrototypeOf(this, InvalidSignatureError.prototype);
  }
}
