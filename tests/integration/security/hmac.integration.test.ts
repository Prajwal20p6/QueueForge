import { HmacSigner, HmacVerifier, HmacHeaderBuilder } from '../../../src/security';

describe('HMAC Integration Tests', () => {
  const config = {
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

  const signer = new HmacSigner(config as any);
  const verifier = new HmacVerifier(config as any, {});
  const builder = new HmacHeaderBuilder(signer);

  it('should sign and verify payloads synchronously using SHA256 signatures', async () => {
    const payload = { event: 'dispatch', data: { id: 101 } };
    const signature = signer.sign('SHA256', payload) as string;

    const verified = await verifier.verify('SHA256', payload, signature);
    expect(verified).toBe(true);
  });

  it('should build webhook signature headers and verify them successfully', async () => {
    const payload = { event: 'dispatch', data: { id: 101 } };
    const headers = builder.buildWebhookHeaders(payload);

    expect(headers['X-Signature']).toBeDefined();
    expect(headers['X-Timestamp']).toBeDefined();

    const signature = headers['X-Signature'].replace('sha256=', '');
    const verified = await verifier.verify('SHA256', payload, signature);
    expect(verified).toBe(true);
  });
});
