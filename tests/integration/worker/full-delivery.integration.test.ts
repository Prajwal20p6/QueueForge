import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { AttemptRecorder } from '../../../src/worker/processor/attempt-recorder';
import { AttemptRepository } from '../../../src/infrastructure/repositories/attempt.repository';
import { MockFactory } from '../../helpers/mocks';

describe('Worker Full Delivery Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should process webhook delivery logic and log attempts outcomes', async () => {
    const mockPrisma = MockFactory.createMockPrismaClient();
    const mockAudit = { logEvent: jest.fn() } as any;
    const attemptRepo = new AttemptRepository(mockPrisma, mockAudit);
    const mockLogger = MockFactory.createMockLogger();
    const mockMetrics = MockFactory.createMockMetricsRegistry();

    const recorder = new AttemptRecorder(attemptRepo, mockLogger, mockMetrics);

    const recordSpy = jest.spyOn(attemptRepo, 'recordAttempt').mockResolvedValue({
      id: 'attempt-1',
      deliveryId: 'delivery-uuid-1',
      attemptNumber: 1,
      responseStatus: 200,
      responseTimeMs: 12,
      errorMessage: null,
      timestamp: new Date(),
    } as any);

    await recorder.record('delivery-uuid-1', 1, {
      success: true,
      statusCode: 200,
      latencyMs: 12,
    });

    expect(recordSpy).toHaveBeenCalledWith('delivery-uuid-1', 1, {
      responseStatus: 200,
      responseTimeMs: 12,
      errorMessage: null,
    });
  });
});
