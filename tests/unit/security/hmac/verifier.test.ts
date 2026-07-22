import Redis from 'ioredis';
import { HmacVerifier } from '../../../../src/security/hmac/verifier';
import { AuthenticationError } from '../../../../src/shared/errors/authentication-error';
import { HmacSigner } from '../../../../src/security/hmac/signer';

describe('HmacVerifier Unit Tests', () => {
  const dummyConfig: any = {
    apiKeySecret: 'a'.repeat(32),
    jwtSecret: 'j'.repeat(32),
    hmacSecret: 'h'.repeat(32),
    jwtExpiryHours: 1,
    jwtAlgorithm: 'HS256',
    enableRateLimiting: false,
    rateLimitRequestsPerMinute: 100,
    enableHMACValidation: false,
    enableRequestSigning: false,
    enableTLS: false,
    enableCORS: false,
    corsOrigins: [],
    corsCredentials: false,
  };

  let mockRedis: jest.Mocked<Redis>;
  let verifier: HmacVerifier;
  let signer: HmacSigner;

  beforeEach(() => {
    mockRedis = {
      exists: jest.fn(),
      setex: jest.fn(),
    } as any;

    verifier = new HmacVerifier(dummyConfig, mockRedis);
    signer = new HmacSigner(dummyConfig);
  });

  it('should extract correct timestamp from formatted header', () => {
    const header = 't=2026-07-17T12:00:00.000Z,s=somehash';
    const timestamp = verifier.extractTimestamp(header);

    expect(timestamp).not.toBeNull();
    expect(timestamp!.toISOString()).toBe('2026-07-17T12:00:00.000Z');
  });

  it('should return null if timestamp format is invalid', () => {
    expect(verifier.extractTimestamp('s=somehash')).toBeNull();
    expect(verifier.extractTimestamp('t=bad-date,s=hash')).toBeNull();
  });

  it('should flag replay attacks when timestamp is expired', () => {
    const oldDate = new Date(Date.now() - 600 * 1000); // 10 minutes ago
    expect(verifier.isReplayAttack(oldDate)).toBe(true);

    const recentDate = new Date(Date.now() - 10 * 1000); // 10 seconds ago
    expect(verifier.isReplayAttack(recentDate)).toBe(false);
  });

  it('should verify and cache signatures successfully', async () => {
    const payload = { test: 'data' };
    const now = new Date();
    const hash = await signer.sign(payload, now);
    const header = `t=${now.toISOString()},s=${hash}`;

    mockRedis.exists.mockResolvedValue(0);

    const result = await verifier.verify(payload, header);
    expect(result).toBe(true);
    expect(mockRedis.setex).toHaveBeenCalledWith(`seen_sig:${hash}`, 300, 'processed');
  });

  it('should block signatures already recorded in the replay cache', async () => {
    const payload = { test: 'data' };
    const now = new Date();
    const hash = await signer.sign(payload, now);
    const header = `t=${now.toISOString()},s=${hash}`;

    mockRedis.exists.mockResolvedValue(1); // signature seen

    await expect(verifier.verify(payload, header)).rejects.toThrow(AuthenticationError);
  });
});
