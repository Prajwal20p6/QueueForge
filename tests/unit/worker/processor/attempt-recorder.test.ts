import { AttemptRecorder } from '../../../../src/worker/processor/attempt-recorder';

describe('AttemptRecorder Unit Tests', () => {
  let recorder: AttemptRecorder;
  let repository: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = {
      recordAttempt: jest.fn(),
      getAttemptHistory: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
        createHistogram: jest.fn().mockReturnValue({
          record: jest.fn(),
        }),
      }),
    };
    recorder = new AttemptRecorder(repository, logger, metrics);
  });

  it('should format and store attempts in repository', async () => {
    await recorder.record('delivery-1', 1, {
      success: true,
      statusCode: 200,
      latencyMs: 150,
    });

    expect(repository.recordAttempt).toHaveBeenCalledWith('delivery-1', 1, {
      responseStatus: 200,
      responseTimeMs: 150,
      errorMessage: null,
    });
  });

  it('should retrieve history logs successfully', async () => {
    repository.getAttemptHistory.mockResolvedValue([{ id: 'attempt-1' }]);
    const res = await recorder.getAttemptHistory('delivery-1');
    expect(res).toBeDefined();
    expect(repository.getAttemptHistory).toHaveBeenCalledWith('delivery-1');
  });
});
