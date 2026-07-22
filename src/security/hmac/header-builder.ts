import { HmacSigner } from './signer';
import { ValidationError } from '../../shared/errors/validation-error';
import { logger as globalLogger } from '../../infrastructure/logging/logger';

/**
 * Utility class constructing standardized Bearer, ApiKey, and HMAC headers.
 */
export class HmacHeaderBuilder {
  private readonly signer: HmacSigner;
  private readonly logger: any;

  constructor(signer?: HmacSigner, logger?: any) {
    this.signer = signer || new HmacSigner({ hmacSecret: 'h'.repeat(32) } as any);
    this.logger = logger || globalLogger;
  }

  /**
   * Builds standardized authentication headers.
   */
  public buildAuthHeaders(payload: any): { 'X-Signature': string; 'X-Timestamp': string } {
    const timestamp = new Date().toISOString();
    const signature = this.signer.sign('SHA256', payload);

    return {
      'X-Signature': `sha256=${signature}`,
      'X-Timestamp': timestamp,
    };
  }

  /**
   * Builds webhook request signatures.
   */
  public buildWebhookHeaders(payload: any): { [key: string]: string } {
    const auth = this.buildAuthHeaders(payload);
    return {
      'X-Signature': auth['X-Signature'],
      'X-Timestamp': auth['X-Timestamp'],
      'Content-Type': 'application/json',
    };
  }

  /**
   * Constructs an HMAC signature and timestamp header representation.
   * Maintained for backwards compatibility.
   */
  public async buildHmacHeader(
    payload: string | object,
    secret: string
  ): Promise<{ signature: string; timestamp: string }> {
    if (!secret || secret.length < 32) {
      throw new ValidationError('HMAC signature secret must be at least 32 characters', {
        secret: 'invalid',
      });
    }

    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();

    const localSigner = new HmacSigner({ hmacSecret: secret } as any, this.logger);
    const hash = await localSigner.sign(payload, timestamp);

    return {
      signature: `t=${timestampStr},s=${hash}`,
      timestamp: timestampStr,
    };
  }

  /**
   * Constructs a standard Authorization Bearer header.
   * Maintained for backwards compatibility.
   */
  public buildBearerHeader(token: string): string {
    if (!token || typeof token !== 'string') {
      throw new ValidationError('Bearer token must be a non-empty string', { token: 'invalid' });
    }
    return `Bearer ${token.trim()}`;
  }

  /**
   * Constructs a standard Authorization ApiKey header.
   * Maintained for backwards compatibility.
   */
  public buildApiKeyHeader(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 32) {
      throw new ValidationError('API Key must be a valid key of at least 32 characters', {
        apiKey: 'invalid',
      });
    }
    return `ApiKey ${apiKey.trim()}`;
  }
}

// Export under both names for backwards compatibility
export { HmacHeaderBuilder as HeaderBuilder };
export { HmacSigner };
export { ValidationError };
export { SecurityConfig } from '../../config/security';
