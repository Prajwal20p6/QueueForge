import Redis from 'ioredis';
import client from 'prom-client';
import { createHmac, timingSafeEqual } from 'crypto';
import { SecurityConfig } from '../../config/security';
import { AuthenticationError } from '../../shared/errors/authentication-error';
import { ValidationError } from '../../shared/errors/validation-error';
import { HmacSigner, deterministicStringify } from './signer';
import { logger as globalLogger } from '../../infrastructure/logging/logger';

// Register prometheus metrics counters and histograms
export const hmacSuccessCounter =
  (client.register.getSingleMetric('hmac_success_total') as client.Counter) ||
  new client.Counter({
    name: 'hmac_success_total',
    help: 'Total number of successful HMAC signature verifications',
  });

export const hmacFailureCounter =
  (client.register.getSingleMetric('hmac_failure_total') as client.Counter) ||
  new client.Counter({
    name: 'hmac_failure_total',
    help: 'Total number of failed HMAC signature verifications',
  });

export const hmacLatencyHistogram =
  (client.register.getSingleMetric('hmac_latency_ms') as client.Histogram) ||
  new client.Histogram({
    name: 'hmac_latency_ms',
    help: 'Latency distribution of HMAC verifications in milliseconds',
    buckets: [0.1, 0.5, 1, 2.5, 5, 10],
  });

/**
 * Verifier auditing webhook request signatures, validating timestamps, and blocking replay attacks.
 */
export class HmacVerifier {
  private readonly redis?: Redis;
  private readonly signer: HmacSigner;
  private readonly config: SecurityConfig;
  private readonly logger: any;
  private readonly defaultMaxAgeSeconds = 300; // 5 minutes

  constructor(config: SecurityConfig, loggerOrRedis: any, logger?: any) {
    this.config = config;
    if (loggerOrRedis && typeof loggerOrRedis.exists === 'function') {
      this.redis = loggerOrRedis;
      this.logger = logger || globalLogger;
    } else {
      this.logger = loggerOrRedis || globalLogger;
    }
    this.signer = new HmacSigner(config, this.logger);
  }

  /**
   * Extracts the timestamp from a formatted signature header value.
   */
  public extractTimestamp(signature: string): Date | null {
    if (!signature) return null;
    const parts = signature.split(',');
    const tPart = parts.find(p => p.trim().startsWith('t='));
    if (!tPart) return null;

    const timestampStr = tPart.trim().substring(2);
    const date = new Date(timestampStr);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Evaluates if a timestamp falls outside the valid time window bounds (replay detection).
   */
  public isReplayAttack(timestamp: Date, maxAgeSeconds = this.defaultMaxAgeSeconds): boolean {
    const now = Date.now();
    const elapsedSeconds = Math.abs(now - timestamp.getTime()) / 1000;
    return elapsedSeconds > maxAgeSeconds;
  }

  /**
   * Verifies the request payload and signature authenticity.
   * Supports:
   * - verify(payload, signature) -> boolean (throws ValidationError on mismatch)
   * - verify(algorithm, payload, signature) -> boolean
   */
  public async verify(
    payloadOrAlgo: any,
    signatureOrPayload: any,
    signatureString?: string
  ): Promise<boolean> {
    const startTime = Date.now();

    // Case 1: verify(algorithm, payload, signature)
    if (payloadOrAlgo === 'SHA256' || payloadOrAlgo === 'SHA512') {
      const algorithm = payloadOrAlgo;
      const payload = signatureOrPayload;
      const signature = signatureString || '';

      const isValid = await this.verifyPayloadWithAlgorithm(algorithm, payload, signature);
      hmacLatencyHistogram.observe(Date.now() - startTime);

      if (!isValid) {
        hmacFailureCounter.inc();
        throw new ValidationError('hmacSignature', { message: 'HMAC signature verification failed' });
      }

      hmacSuccessCounter.inc();
      return true;
    }

    // Case 2: verify(payload, signature) with direct hex signature (no 't=' format)
    const payload = payloadOrAlgo;
    const signature = signatureOrPayload;

    if (signature && !signature.includes('t=')) {
      const isValid = await this.verifyPayloadWithAlgorithm('SHA256', payload, signature);
      hmacLatencyHistogram.observe(Date.now() - startTime);

      if (!isValid) {
        hmacFailureCounter.inc();
        throw new ValidationError('hmacSignature', { message: 'HMAC signature verification failed' });
      }

      hmacSuccessCounter.inc();
      return true;
    }

    // Case 3: Legacy signature: verify(payload, header) where header is 't=...,s=...'
    const result = await this.verifyLegacy(payload, signature);
    hmacLatencyHistogram.observe(Date.now() - startTime);
    return result;
  }

  /**
   * Verifies a raw string signature.
   */
  public async verifyString(data: string, signature: string): Promise<boolean> {
    return this.verify(data, signature);
  }

  /**
   * Verifies payload against comma-separated hmac secrets list.
   */
  private async verifyPayloadWithAlgorithm(
    algorithm: 'SHA256' | 'SHA512',
    payload: any,
    signature: string
  ): Promise<boolean> {
    const secrets = (this.config.hmacSecret || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const serialized = typeof payload === 'string' ? payload : deterministicStringify(payload);

    for (const secret of secrets) {
      const algo = algorithm.toLowerCase() as 'sha256' | 'sha512';
      const expected = createHmac(algo, secret).update(serialized).digest('hex');

      try {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
          return true;
        }
      } catch {
        // Try next secret
      }
    }

    return false;
  }

  /**
   * Legacy verifier backing replay prevention cache checks.
   */
  private async verifyLegacy(payload: string | object, signature: string): Promise<boolean> {
    const timestamp = this.extractTimestamp(signature);
    if (!timestamp) {
      this.logger.info('Signature verification failed: missing timestamp');
      throw new AuthenticationError('Signature timestamp is missing or malformed');
    }

    if (this.isReplayAttack(timestamp)) {
      this.logger.info('Replay attack check failed: timestamp expired');
      throw new AuthenticationError('Signature timestamp has expired');
    }

    const parts = signature.split(',');
    const sPart = parts.find(p => p.trim().startsWith('s='));
    if (!sPart) {
      throw new AuthenticationError('Signature hash parameter is missing');
    }
    const signatureHash = sPart.trim().substring(2);

    const isValid = await this.signer.verify(payload, signatureHash, timestamp);
    if (!isValid) {
      hmacFailureCounter.inc();
      this.logger.info('Signature verification failed: hash mismatch');
      throw new AuthenticationError('Signature does not match payload');
    }

    if (this.redis) {
      const replayKey = `seen_sig:${signatureHash}`;
      const exists = await this.redis.exists(replayKey);
      if (exists === 1) {
        hmacFailureCounter.inc();
        this.logger.info('Replay attack detected: signature already processed');
        throw new AuthenticationError('Signature has already been processed (replay)');
      }
      await this.redis.setex(replayKey, this.defaultMaxAgeSeconds, 'processed');
    }

    hmacSuccessCounter.inc();
    return true;
  }
}
