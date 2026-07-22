import { createHmac, timingSafeEqual } from 'crypto';
import { SecurityConfig } from '../../config/security';
import { logger as globalLogger } from '../../infrastructure/logging/logger';

/**
 * Recursively serializes an object with keys sorted alphabetically to guarantee deterministic string signatures.
 */
export function deterministicStringify(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const properties = keys.map(key => `${JSON.stringify(key)}:${deterministicStringify(obj[key])}`);
  return '{' + properties.join(',') + '}';
}

/**
 * Signer utility managing HMAC signing and verification.
 */
export class HmacSigner {
  private readonly config: SecurityConfig;
  private readonly logger: any;

  constructor(config: SecurityConfig, logger?: any) {
    this.config = config;
    this.logger = logger || globalLogger;
  }

  /**
   * Generates a raw HMAC hex string using custom algorithm and secret.
   */
  private computeHmac(algorithm: 'sha256' | 'sha512', data: string, secret: string): string {
    return createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * Signs a payload using HMAC-SHA256 or HMAC-SHA512.
   * Supports:
   * - sign(payload) -> string
   * - sign(algorithm, payload) -> string
   * - sign(payload, timestamp) -> Promise<string> (legacy)
   */
  public sign(
    payloadOrAlgo: any,
    payloadOrTimestamp?: any
  ): string | Promise<string> {
    this.logger.debug('Executing HMAC sign operation');

    // Case 1: sign(algorithm, payload) -> synchronous string
    if (payloadOrAlgo === 'SHA256' || payloadOrAlgo === 'SHA512') {
      const algorithm = payloadOrAlgo.toLowerCase() as 'sha256' | 'sha512';
      const payload = payloadOrTimestamp;
      const serialized = typeof payload === 'string' ? payload : deterministicStringify(payload);
      return this.computeHmac(algorithm, serialized, this.config.hmacSecret);
    }

    // Case 2: sign(payload, timestamp) -> legacy Promise<string>
    if (payloadOrTimestamp instanceof Date) {
      const payload = payloadOrAlgo;
      const timestamp = payloadOrTimestamp;
      const serialized = typeof payload === 'string' ? payload : deterministicStringify(payload);
      const dataToSign = `${timestamp.toISOString()}.${serialized}`;
      return Promise.resolve(this.computeHmac('sha256', dataToSign, this.config.hmacSecret));
    }

    // Case 3: sign(payload) -> synchronous string using default sha256
    const payload = payloadOrAlgo;
    const serialized = typeof payload === 'string' ? payload : deterministicStringify(payload);
    return this.computeHmac('sha256', serialized, this.config.hmacSecret);
  }

  /**
   * Synchronously signs a string payload.
   */
  public signString(data: string): string {
    return this.computeHmac('sha256', data, this.config.hmacSecret);
  }

  /**
   * Performs timing-safe equality checks to verify signature matches payload.
   * Maintained for backwards compatibility.
   */
  public async verify(
    payload: string | object,
    signature: string,
    timestamp = new Date()
  ): Promise<boolean> {
    const expected = await this.sign(payload, timestamp);
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}
export { SecurityConfig };
