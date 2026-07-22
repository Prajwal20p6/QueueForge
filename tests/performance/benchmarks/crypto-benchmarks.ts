/**
 * @fileoverview Cryptographic Benchmarks
 * Measures operations per second and latency for SHA256 hashing, HMAC signing, and JWT verification.
 */

import * as crypto from 'crypto';
import { DatabaseBenchmarks, BenchmarkStats } from './database-benchmarks';

export class CryptoBenchmarks {
  private readonly calc = new DatabaseBenchmarks();

  public async benchmarkHmacSign(iterations = 100): Promise<BenchmarkStats> {
    const payload = 'x'.repeat(1024);
    const secret = 'webhook_secret_key_12345';
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const end = performance.now();
      latencies.push(end - start);
    }
    return this.calc.calculateStats(latencies);
  }

  public async benchmarkSha256Hash(iterations = 100): Promise<BenchmarkStats> {
    const payload = 'x'.repeat(1024);
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      crypto.createHash('sha256').update(payload).digest('hex');
      const end = performance.now();
      latencies.push(end - start);
    }
    return this.calc.calculateStats(latencies);
  }
}

describe('Cryptographic Benchmarks', () => {
  const cryptoBench = new CryptoBenchmarks();

  it('should measure HMAC SHA256 signature generation speed', async () => {
    const stats = await cryptoBench.benchmarkHmacSign(100);
    expect(stats.p95).toBeLessThan(10);
  });

  it('should measure SHA256 hash calculation speed', async () => {
    const stats = await cryptoBench.benchmarkSha256Hash(100);
    expect(stats.p95).toBeLessThan(10);
  });
});
