import { HMACVerifier } from './hmac-verifier';
import { InvalidSignatureError } from '../errors/invalid-signature-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Middleware utility validating incoming HTTP webhook requests for valid signatures and timestamps.
 */
export class WebhookValidator {
  constructor(
    private readonly verifier: HMACVerifier,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Validates raw body string, X-Signature, and X-Timestamp headers using the secret key.
   */
  public validateSignature(body: string, signature: string, timestamp: string, secret: string): boolean {
    return this.verifier.verifyHeader(body, signature, timestamp, secret);
  }

  /**
   * Inspects Express-like request headers and body, verifying signature integrity and parsing JSON payload.
   */
  public async validateWebhookRequest(
    request: any,
    secret: string
  ): Promise<{ valid: boolean; payload: any }> {
    if (!request) {
      throw new InvalidSignatureError('missing_signature');
    }

    const headers = request.headers || {};
    const signature = headers['x-signature'] || headers['x-hub-signature-256'] || headers['X-Signature'];
    const timestamp = headers['x-timestamp'] || headers['X-Timestamp'];

    if (!signature) {
      throw new InvalidSignatureError('missing_signature');
    }

    if (!timestamp) {
      throw new InvalidSignatureError('missing_signature');
    }

    const rawBody = typeof request.rawBody === 'string'
      ? request.rawBody
      : (typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {}));

    // Verify signature & timestamp age
    this.validateSignature(rawBody, signature, timestamp, secret);

    let parsedPayload: any = request.body;
    if (typeof rawBody === 'string' && typeof parsedPayload !== 'object') {
      try {
        parsedPayload = JSON.parse(rawBody);
      } catch {
        parsedPayload = rawBody;
      }
    }

    this.logger?.debug?.(`Webhook signature successfully validated for request timestamp ${timestamp}`);
    return { valid: true, payload: parsedPayload };
  }
}
