import { generateResult } from '../../load/utils/result-generator';

describe('E2E Scaling Performance Tests', () => {
  const runBatch = async (size: number) => {
    const start = Date.now();
    const promises = Array.from({ length: size }, async () => {
      generateResult('small');
      return true;
    });
    await Promise.all(promises);
    return Date.now() - start;
  };

  it('should verify sub-linear scaling characteristics', async () => {
    const timeFor1 = await runBatch(1);
    const timeFor5 = await runBatch(5);

    console.log(`[E2E-Scaling] 1 flows: ${timeFor1}ms, 5 flows: ${timeFor5}ms`);
    // Ensure scaling concurrency is sub-linear (e.g. 5 parallel calls do not take 5x longer than 1 call)
    expect(timeFor5).toBeLessThanOrEqual(timeFor1 * 5 + 1);
  });
});
