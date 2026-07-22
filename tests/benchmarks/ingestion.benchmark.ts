import { generateResult } from '../load/utils/result-generator';
import crypto from 'crypto';

/**
 * Benchmark result ingestion computations.
 */
export async function runIngestionBenchmark(): Promise<void> {
  console.log('Ingestion Benchmark: Processing 1000 payload schemas...');

  const payloads = Array.from({ length: 1000 }, () => generateResult('small'));
  const start = Date.now();

  payloads.forEach((payload) => {
    // Simulate composite key hashing
    const key = crypto
      .createHash('sha256')
      .update(payload.emailId + ':' + payload.agentId + ':' + JSON.stringify(payload.resultPayload))
      .digest('hex');
  });

  const duration = Date.now() - start;
  console.log(`  - 1000 keys hashed: ${duration}ms (Avg: ${(duration / 1000).toFixed(3)}ms/key)\n`);
}
