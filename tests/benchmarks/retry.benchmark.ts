/**
 * Benchmark backoff arithmetic calculation.
 */
export async function runRetryBenchmark(): Promise<void> {
  console.log('Retry Benchmark: Calculating backoffs...');
  const start = Date.now();

  const calculateBackoff = (attempt: number) => {
    const base = 1000;
    const factor = 2;
    const max = 30000;
    const delay = Math.min(max, base * Math.pow(factor, attempt));
    const jitter = Math.random() * 0.2 * delay;
    return delay + jitter;
  };

  for (let i = 0; i < 1000; i++) {
    calculateBackoff(i % 5);
  }

  const duration = Date.now() - start;
  console.log(`  - 1000 backoffs calculated: ${duration}ms (Avg: ${(duration / 1000).toFixed(3)}ms/retry)\n`);
}
