import { DeliveryExecutor } from '../../../src/worker/delivery-executor';

describe('DeliveryExecutor Unit Tests', () => {
  let mockConnectorFactory: any;
  let mockStateMachine: any;
  let mockErrorClassifier: any;
  let mockAttemptRecorder: any;
  let mockResilience: any;
  let mockRepositories: any;
  let executor: DeliveryExecutor;

  beforeEach(() => {
    mockConnectorFactory = {
      create: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({ success: true, statusCode: 200 }),
      }),
    };

    mockStateMachine = {
      markProcessing: jest.fn().mockResolvedValue({ id: 'del-1', status: 'PROCESSING' }),
      markCompleted: jest.fn().mockResolvedValue({ id: 'del-1', status: 'COMPLETED' }),
      scheduleRetry: jest.fn().mockResolvedValue({ id: 'del-1', status: 'SCHEDULED_RETRY' }),
      moveToDeadLetterQueue: jest.fn().mockResolvedValue({ id: 'del-1', status: 'FAILED_DLQ' }),
    };

    mockErrorClassifier = {
      classify: jest.fn().mockReturnValue({ category: 'TRANSIENT', retryable: true }),
    };

    mockAttemptRecorder = {
      recordSuccess: jest.fn().mockResolvedValue({ id: 'att-1' }),
      recordFailure: jest.fn().mockResolvedValue({ id: 'att-1' }),
    };

    mockResilience = {
      circuitBreaker: {
        getOrCreateBreaker: jest.fn().mockReturnValue({
          getState: jest.fn().mockReturnValue('CLOSED'),
          recordSuccess: jest.fn(),
          recordFailure: jest.fn(),
        }),
        isOpen: jest.fn().mockReturnValue(false),
      },
      bulkhead: {
        acquire: jest.fn().mockResolvedValue('ticket-123'),
        release: jest.fn(),
      },
    };

    mockRepositories = {
      deliveries: {
        findById: jest.fn().mockResolvedValue({
          id: 'del-1',
          destinationId: 'dest-1',
          taskResultId: 'res-1',
        }),
      },
      destinations: {
        findById: jest.fn().mockResolvedValue({
          id: 'dest-1',
          destinationType: 'WEBHOOK',
          endpoint: 'https://example.com/webhook',
        }),
      },
      results: {
        findById: jest.fn().mockResolvedValue({ id: 'res-1', resultPayload: { classification: 'cat' } }),
      },
    };

    executor = new DeliveryExecutor(
      mockConnectorFactory,
      mockStateMachine,
      mockErrorClassifier,
      mockAttemptRecorder,
      mockResilience,
      mockRepositories
    );
  });

  it('should execute delivery successfully through connector and update state machine to COMPLETED', async () => {
    const result = await executor.execute('del-1');

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(mockStateMachine.markProcessing).toHaveBeenCalledWith('del-1');
    expect(mockStateMachine.markCompleted).toHaveBeenCalledWith('del-1', expect.any(Number));
    expect(mockAttemptRecorder.recordSuccess).toHaveBeenCalled();
  });

  it('should handle transient connector errors by scheduling retries', async () => {
    mockConnectorFactory.create.mockReturnValue({
      execute: jest.fn().mockResolvedValue({ success: false, statusCode: 503, error: new Error('503 Service Unavailable') }),
    });

    mockErrorClassifier.classify.mockReturnValue({ category: 'TRANSIENT', retryable: true });

    const result = await executor.execute('del-1');

    expect(result.success).toBe(false);
    expect(mockStateMachine.scheduleRetry).toHaveBeenCalledWith('del-1', 5000, expect.any(Error));
  });

  it('should move delivery to DLQ on permanent connector failures', async () => {
    mockConnectorFactory.create.mockReturnValue({
      execute: jest.fn().mockResolvedValue({ success: false, statusCode: 400, error: new Error('400 Bad Request') }),
    });

    mockErrorClassifier.classify.mockReturnValue({ category: 'PERMANENT', retryable: false });

    const result = await executor.execute('del-1');

    expect(result.success).toBe(false);
    expect(mockStateMachine.moveToDeadLetterQueue).toHaveBeenCalledWith('del-1', expect.any(String));
  });
});
