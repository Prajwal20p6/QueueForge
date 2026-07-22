import crypto from 'crypto';
import { HMACSignature } from './hmac-signer';
import { InvalidSignatureError } from '../errors/invalid-signature-error';
import { SecurityConfig } from '../../config/security.config';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Service managing HMAC-SHA256 signing, signature checking, and request replay protection.
 */
export class HMACVerifier {
  private readonly algorithm: string;

  constructor(
    config?: SecurityConfig | any,
    private readonly logger?: Logger | any
  ) {
    this.algorithm = config?.hmacAlgorithm || config?.hmac?.algorithm || 'sha256';
  }

  /**
   * Computes a cryptographic HMACSignature over data payload.
   */
  public sign(data: string, secret: string, timestamp: number = Date.now()): HMACSignature {
    if (!secret || typeof secret !== 'string') {
      throw new InvalidSignatureError('Signing secret is missing or empty.');
    }

    const payloadToSign = `${timestamp}.${data}`;
    const hexSig = crypto.createHmac(this.algorithm, secret).update(payloadToSign).digest('hex');

    return new HMACSignature(hexSig, this.algorithm, timestamp);
  }

  public computeHmac(data: string, secret: string): string {
    return crypto.createHmac(this.algorithm, secret).update(data).digest('hex');
  }

  public signString(data: string, secret: string): string {
    return this.computeHmac(data, secret);
  }

  /**
   * Verifies an HMACSignature object against payload data and secret.
   */
  public verify(data: string, signatureObj: HMACSignature | any, secret: string): boolean {
    if (!signatureObj || !secret) return false;

    const rawSig = typeof signatureObj.getSignature === 'function' ? signatureObj.getSignature() : (signatureObj.signature || String(signatureObj));
    const ts = typeof signatureObj.getTimestamp === 'function' ? signatureObj.getTimestamp() : (signatureObj.timestamp || Date.now());

    const expected = this.sign(data, secret, ts);
    const expectedHex = expected.getSignature();

    try {
      const a = Buffer.from(expectedHex, 'utf8');
      const b = Buffer.from(rawSig.replace(/^sha256=/, ''), 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Generates header signature and timestamp strings for outbound webhook requests.
   */
  public generateHeader(data: string, secret: string): { signature: string; timestamp: string } {
    const ts = Date.now();
    const hmacSig = this.sign(data, secret, ts);
    return {
      signature: hmacSig.toString(),
      timestamp: String(ts),
    };
  }

  /**
   * Cryptographically verifies header signature and asserts request timestamp is not older than maxAgeMs (default 5 min).
   */
  public verifyHeader(
    data: string,
    headerSignature: string,
    headerTimestamp: string,
    secret: string,
    maxAgeMs: number = 300000
  ): boolean {
    if (!headerSignature || !headerTimestamp || !secret) {
      throw new InvalidSignatureError('missing_signature');
    }

    const ts = parseInt(headerTimestamp, 10);
    if (isNaN(ts)) {
      throw new InvalidSignatureError('malformed_header');
    }

    // Replay attack protection check (< 5 minutes old)
    const age = Math.abs(Date.now() - ts);
    if (age > maxAgeMs) {
      this.logger?.warn?.(`Request timestamp is expired. Request age: ${age}ms (max allowed: ${maxAgeMs}ms)`);
      throw new InvalidSignatureError('expired_request');
    }

    const cleanSig = headerSignature.replace(/^sha256=/, '');
    const hmacSig = new HMACSignature(cleanSig, this.algorithm, ts);

    const isValid = this.verify(data, hmacSig, secret);
    if (!isValid) {
      throw new InvalidSignatureError('invalid_signature');
    }

    return true;
  }
}
