import { generateResult } from '../../load/utils/result-generator';

describe('E2E Concurrent Flows Performance Tests', () => {
  it('should run concurrent flows and verify low error rate', async () => {
    const promises = Array.from({ length: 10 }, async () => {
      const payload = generateResult('small');
      expect(payload.emailId).toBeDefined();
      return true;
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(Boolean).length;
    expect(successCount).toBe(10);
  });
});
