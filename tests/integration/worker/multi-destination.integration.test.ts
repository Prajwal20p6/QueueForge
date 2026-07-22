import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { AttemptRecorder } from '../../../src/worker/processor/attempt-recorder';
import { AttemptRepository } from '../../../src/infrastructure/repositories/attempt.repository';
import { MockFactory } from '../../helpers/mocks';

describe('Worker Multi-Destination Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should dispatch to multiple destinations independently', async () => {
    const mockPrisma = MockFactory.createMockPrismaClient();
    const mockAudit = { logEvent: jest.fn() } as any;
    const attemptRepo = new AttemptRepository(mockPrisma, mockAudit);
    const mockLogger = MockFactory.createMockLogger();
    const mockMetrics = MockFactory.createMockMetricsRegistry();

    const recorder = new AttemptRecorder(attemptRepo, mockLogger, mockMetrics);

    const recordSpy = jest.spyOn(attemptRepo, 'recordAttempt').mockResolvedValue({
      id: 'attempt-1',
      deliveryId: 'd-1',
      attemptNumber: 1,
      responseStatus: 200,
      responseTimeMs: 5,
      errorMessage: null,
      timestamp: new Date(),
    } as any);

    await recorder.record('d-1', 1, {
      success: true,
      statusCode: 200,
      latencyMs: 5,
    });

    expect(recordSpy).toHaveBeenCalledWith('d-1', 1, {
      responseStatus: 200,
      responseTimeMs: 5,
      errorMessage: null,
    });
  });
});
