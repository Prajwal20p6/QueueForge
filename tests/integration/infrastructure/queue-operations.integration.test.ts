import { Job } from 'bullmq';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { QueueManager } from '../../../src/infrastructure/queue/queue-manager';
import { QueueClient } from '../../../src/infrastructure/queue/queue-client';
import { getConfig } from '../../../src/config';
import { initializeRepositories } from '../../../src/infrastructure/repositories';
import { getPrismaClient } from '../../../src/infrastructure/database/client';
import { initializeObservability } from '../../../src/observability';

describe('queue-operations.integration', () => {
  let redis: any;
  let queueManager: QueueManager;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    redis = stack.redis;

    const config = getConfig();
    const logger = console as any;
    const obs = await initializeObservability(config.observability);
    const prisma = getPrismaClient();
    const repos = await initializeRepositories(prisma, logger);
    if (redis.options?._isMock) {
      let idCounter = 0;
      const activeJobs = new Map<string, any>();
      const createMockQueue = (qName: string) => ({
        name: qName,
        add: jest.fn().mockImplementation(async (_name, data, opts) => {
          const jobId = `job-uuid-${++idCounter}`;
          const key = `${qName}:${jobId}`;
          const jobObj = {
            id: jobId,
            data,
            progress: 0,
            getState: async () => (opts?.delay ? 'delayed' : 'waiting'),
            remove: jest.fn().mockImplementation(async () => {
              activeJobs.delete(key);
            }),
            retry: jest.fn(),
          };
          activeJobs.set(key, jobObj);
          return jobObj;
        }),
        getJobCounts: jest.fn().mockResolvedValue({
          active: 1,
          waiting: 2,
          delayed: 3,
          failed: 4,
          completed: 5,
        }),
        pause: jest.fn(),
        resume: jest.fn(),
        drain: jest.fn(),
      });

      jest.spyOn(QueueClient.prototype, 'getQueue').mockImplementation((name: string) => {
        return createMockQueue(name) as any;
      });
      jest.spyOn(QueueClient.prototype, 'createQueue').mockImplementation((name: string) => {
        return createMockQueue(name) as any;
      });
      jest.spyOn(Job, 'fromId').mockImplementation(async (q: any, id: string) => {
        const qName = q.name || 'queueforge-main';
        return activeJobs.get(`${qName}:${id}`) || null;
      });
    }

    const client = new QueueClient(redis, config.queue, logger);

    queueManager = new QueueManager(client, repos, logger, obs);
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should enqueue, pause, resume, and count jobs in the queue stack', async () => {
    const job = await queueManager.enqueueJob({
      deliveryId: 'del-integration-test-1',
      payload: { text: 'ok' },
    });

    expect(job.id).toBeDefined();

    const progress = await queueManager.getJobProgress(job.id!);
    expect(progress).toBe(0);

    const depth = await queueManager.getQueueDepth();
    expect(depth.main).toBeGreaterThan(0);

    await queueManager.pauseQueue();
    await queueManager.resumeQueue();

    await queueManager.cancelJob(job.id!);
  });
});
