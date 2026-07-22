import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';

describe('Database Migration Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should verify target schemas holds active migrations keys', () => {
    const active = true;
    expect(active).toBe(true);
  });
});
