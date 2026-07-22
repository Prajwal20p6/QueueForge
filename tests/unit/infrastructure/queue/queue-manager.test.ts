import { Queue } from 'bullmq';
import { QueueManager, JobData } from '../../../../src/infrastructure/queue/queue-manager';
import { QueueClient } from '../../../../src/infrastructure/queue/queue-client';
import { Repositories } from '../../../../src/infrastructure/repositories';
import { Logger } from 'winston';
import { ObservabilityContext } from '../../../../src/observability/types';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

jest.mock('bullmq');
jest.mock('../../../../src/infrastructure/queue/queue-client');

describe('queue-manager Unit Tests', () => {
  let mockClient: jest.Mocked<QueueClient>;
  let mockMainQueue: jest.Mocked<Queue>;
  let mockDelayedQueue: jest.Mocked<Queue>;
  let mockDlqQueue: jest.Mocked<Queue>;
  let repositories: Repositories;
  let logger: Logger;
  let observability: ObservabilityContext;
  let manager: QueueManager;

  beforeEach(() => {
    mockMainQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-main' }),
      getJobCounts: jest.fn().mockResolvedValue({ active: 1, waiting: 2 }),
      pause: jest.fn(),
      resume: jest.fn(),
    } as any;
    mockDelayedQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-delayed' }),
      getJobCounts: jest.fn().mockResolvedValue({ delayed: 3 }),
      pause: jest.fn(),
      resume: jest.fn(),
    } as any;
    mockDlqQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-dlq' }),
      getJobCounts: jest.fn().mockResolvedValue({ failed: 4, waiting: 0 }),
      pause: jest.fn(),
      resume: jest.fn(),
    } as any;

    mockClient = {
      config: {
        mainQueueName: 'main-q',
        delayedQueueName: 'delayed-q',
        dlqQueueName: 'dlq-q',
      },
      getQueue: jest.fn().mockImplementation((name) => {
        if (name === 'main-q') return mockMainQueue;
        if (name === 'delayed-q') return mockDelayedQueue;
        return mockDlqQueue;
      }),
    } as any;

    repositories = {} as any;
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    const mockSpan = {
      end: jest.fn(),
      recordException: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      addEvent: jest.fn(),
      setStatus: jest.fn(),
      updateName: jest.fn(),
    };
    observability = {
      tracer: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockReturnValue(mockSpan),
        }),
      },
      metrics: {},
    } as any;

    manager = new QueueManager(mockClient, repositories, logger, observability);
    jest.clearAllMocks();
  });

  describe('enqueueJob', () => {
    it('should validate and enqueue job successfully', async () => {
      const data: JobData = {
        deliveryId: 'del-123',
        payload: { text: 'ok' },
      };

      const job = await manager.enqueueJob(data);
      expect(job.id).toBe('job-main');
      expect(mockMainQueue.add).toHaveBeenCalled();
    });

    it('should throw ValidationError on empty deliveryId', async () => {
      const data: JobData = {
        deliveryId: '',
        payload: { text: 'ok' },
      };
      await expect(manager.enqueueJob(data)).rejects.toThrow(ValidationError);
    });
  });

  describe('Queue Actions', () => {
    it('should calculate correct queue depth values', async () => {
      const depth = await manager.getQueueDepth();
      expect(depth.main).toBe(3);
      expect(depth.delayed).toBe(3);
      expect(depth.dlq).toBe(4);
    });

    it('should pause and resume all queues', async () => {
      await manager.pauseQueue();
      expect(mockMainQueue.pause).toHaveBeenCalled();
      expect(mockDelayedQueue.pause).toHaveBeenCalled();
      expect(mockDlqQueue.pause).toHaveBeenCalled();

      await manager.resumeQueue();
      expect(mockMainQueue.resume).toHaveBeenCalled();
      expect(mockDelayedQueue.resume).toHaveBeenCalled();
      expect(mockDlqQueue.resume).toHaveBeenCalled();
    });
  });
});
