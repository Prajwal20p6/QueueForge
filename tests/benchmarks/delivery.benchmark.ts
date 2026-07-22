/**
 * Benchmark webhook delivery execution.
 */
export async function runDeliveryBenchmark(): Promise<void> {
  console.log('Delivery Benchmark: Processing webhook signings...');
  const start = Date.now();

  // Simulate HMAC calculations for 1000 deliveries
  const crypto = require('crypto');
  const secret = 'mock-secret';
  for (let i = 0; i < 1000; i++) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update('2026-07-18T12:00:00Z.{"data":"payload"}');
    hmac.digest('hex');
  }

  const duration = Date.now() - start;
  console.log(`  - 1000 HMAC signatures generated: ${duration}ms (Avg: ${(duration / 1000).toFixed(3)}ms/sign)\n`);
}
