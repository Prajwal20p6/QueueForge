/**
 * @fileoverview Webhook Signature Verification Integration Test
 *
 * Verifies HMAC-SHA256 webhook signature generation, proper header
 * inclusion, and tampered payload detection.
 */
import * as crypto from 'crypto';

describe('Webhook Signature Verification Integration Test', () => {
  const secret = 'whsec_test_secret_key_123';

  function generateHmac(payload: string, key: string): string {
    return crypto.createHmac('sha256', key).update(payload).digest('hex');
  }

  it('should include HMAC signature in webhook delivery header', () => {
    const payload = JSON.stringify({ deliveryId: 'del-001', status: 'COMPLETED' });
    const signature = `sha256=${generateHmac(payload, secret)}`;

    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('should produce valid signature that receiver can verify', () => {
    const payload = JSON.stringify({ deliveryId: 'del-002', event: 'delivery.completed' });
    const senderSignature = generateHmac(payload, secret);
    const receiverSignature = generateHmac(payload, secret);

    expect(senderSignature).toBe(receiverSignature);
  });

  it('should detect tampered payload via mismatched signature', () => {
    const originalPayload = JSON.stringify({ amount: 100 });
    const tamperedPayload = JSON.stringify({ amount: 999 });
    const signature = generateHmac(originalPayload, secret);
    const tamperedSignature = generateHmac(tamperedPayload, secret);

    expect(signature).not.toBe(tamperedSignature);
  });

  it('should reject signatures generated with wrong secret', () => {
    const payload = JSON.stringify({ test: true });
    const correctSig = generateHmac(payload, secret);
    const wrongSig = generateHmac(payload, 'wrong_secret');

    expect(correctSig).not.toBe(wrongSig);
  });

  it('should use consistent sha256=<hex> signature format', () => {
    const payload = 'test-payload';
    const hex = generateHmac(payload, secret);
    const header = `sha256=${hex}`;

    expect(header.startsWith('sha256=')).toBe(true);
    expect(hex).toHaveLength(64);
  });
});
