import { HmacSigner, deterministicStringify } from '../../../../src/security/hmac/signer';

describe('HmacSigner Unit Tests', () => {
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

  let signer: HmacSigner;

  beforeEach(() => {
    signer = new HmacSigner(dummyConfig);
  });

  describe('deterministicStringify', () => {
    it('should sort keys of an object alphabetically', () => {
      const obj1 = { b: 2, a: 1 };
      const obj2 = { a: 1, b: 2 };

      expect(deterministicStringify(obj1)).toBe(deterministicStringify(obj2));
      expect(deterministicStringify(obj1)).toBe('{"a":1,"b":2}');
    });

    it('should sort nested objects recursively', () => {
      const nested1 = { y: { b: 2, a: 1 }, x: 10 };
      const nested2 = { x: 10, y: { a: 1, b: 2 } };

      expect(deterministicStringify(nested1)).toBe(deterministicStringify(nested2));
    });
  });

  describe('signing operations', () => {
    it('should generate consistent signatures for objects and strings', async () => {
      const timestamp = new Date('2026-07-17T12:00:00.000Z');
      const sig1 = await signer.sign({ b: 2, a: 1 }, timestamp);
      const sig2 = await signer.sign({ a: 1, b: 2 }, timestamp);

      expect(sig1).toBe(sig2);
    });

    it('should verify signature successfully', async () => {
      const payload = { test: 'payload' };
      const timestamp = new Date();
      const signature = await signer.sign(payload, timestamp);

      const isValid = await signer.verify(payload, signature, timestamp);
      expect(isValid).toBe(true);
    });

    it('should reject tampered signatures or payloads', async () => {
      const payload = { test: 'payload' };
      const timestamp = new Date();
      const signature = await signer.sign(payload, timestamp);

      const isInvalidPayload = await signer.verify({ test: 'tampered' }, signature, timestamp);
      expect(isInvalidPayload).toBe(false);

      const isInvalidSig = await signer.verify(payload, signature + 'bad', timestamp);
      expect(isInvalidSig).toBe(false);
    });
  });
});
