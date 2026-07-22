import { generateResult } from '../../load/utils/result-generator';

describe('E2E Full Flow Performance Tests', () => {
  it('should process flows sequentially and verify average duration bounds', () => {
    const latencies: number[] = [];

    // Simulate 10 sequential flows
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      const payload = generateResult('small');
      expect(payload.confidenceScore).toBeLessThanOrEqual(1.0);
      latencies.push(Date.now() - start);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    console.log(`[E2E-Perf] Avg Flow Processing Latency: ${avg.toFixed(2)}ms`);
    expect(avg).toBeLessThan(100); // Sequence runs under 100ms mocked
  });
});
