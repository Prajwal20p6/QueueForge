import { QuotaManager } from '../../../src/security/rate-limiting/quota-manager';
import { QuotaTracker } from '../../../src/security/rate-limiting/quota-tracker';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { MockFactory } from '../../helpers/mocks';

describe('Quota Management Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should update user quota subscription tier configurations', async () => {
    const mockLogger = MockFactory.createMockLogger();
    const mockRedis = MockFactory.createMockRedisClient() as any;
    const tracker = new QuotaTracker(mockRedis, []);
    const manager = new QuotaManager(tracker, mockLogger);

    const spy = jest.spyOn(tracker, 'updateUsage').mockResolvedValue();

    await manager.updateUserQuotaTier('user-abc', 'pro');

    expect(spy).toHaveBeenCalledWith('user-abc', 'results_ingestion', 0);
  });
});
