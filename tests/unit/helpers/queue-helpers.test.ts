import { QueueTestHelper } from '../../helpers/queue-helpers';
import { Queue, Job } from 'bullmq';

const buildMockQueue = (): jest.Mocked<Queue> => ({
  obliterate: jest.fn().mockResolvedValue(undefined),
  drain: jest.fn().mockResolvedValue(undefined),
  getWaiting: jest.fn().mockResolvedValue([]),
  getActive: jest.fn().mockResolvedValue([]),
  getDelayed: jest.fn().mockResolvedValue([]),
  getFailed: jest.fn().mockResolvedValue([]),
  getCompleted: jest.fn().mockResolvedValue([]),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 2,
    active: 1,
    delayed: 0,
    failed: 1,
    completed: 5,
    paused: 0,
  }),
  getJob: jest.fn().mockResolvedValue(null),
  name: 'test-queue',
} as unknown as jest.Mocked<Queue>);

describe('QueueTestHelper Unit Tests', () => {
  it('should call obliterate on cleanup', async () => {
    const queue = buildMockQueue();
    const helper = new QueueTestHelper(queue);
    await helper.cleanup();
    expect(queue.obliterate).toHaveBeenCalledWith({ force: true });
  });

  it('should call drain on drainQueue', async () => {
    const queue = buildMockQueue();
    const helper = new QueueTestHelper(queue);
    await helper.drainQueue();
    expect(queue.drain).toHaveBeenCalledWith(true);
  });

  it('should return total job count across all states', async () => {
    const queue = buildMockQueue();
    const helper = new QueueTestHelper(queue);
    const count = await helper.getJobCount();
    // waiting(2) + active(1) + delayed(0) + failed(1) + completed(5) + paused(0) = 9
    expect(count).toBe(9);
  });

  it('should return jobs for a specific status', async () => {
    const mockJob = { id: 'job-1', data: {} } as Job;
    const queue = buildMockQueue();
    (queue.getWaiting as jest.Mock).mockResolvedValue([mockJob]);
    const helper = new QueueTestHelper(queue);
    const jobs = await helper.getJobs('waiting');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.id).toBe('job-1');
  });

  it('should return all jobs when no status filter is provided', async () => {
    const queue = buildMockQueue();
    (queue.getWaiting as jest.Mock).mockResolvedValue([{ id: 'j1' }]);
    (queue.getActive as jest.Mock).mockResolvedValue([{ id: 'j2' }]);
    const helper = new QueueTestHelper(queue);
    const jobs = await helper.getJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(2);
  });

  it('should throw when waiting for a job that does not exist', async () => {
    const queue = buildMockQueue();
    (queue.getJob as jest.Mock).mockResolvedValue(null);
    const helper = new QueueTestHelper(queue);
    await expect(helper.waitForJob('missing-id', 300)).rejects.toThrow(
      'Job "missing-id" did not reach terminal state within 300ms'
    );
  });

  it('should resolve waitForJob when job state is completed', async () => {
    const mockJob = {
      id: 'job-done',
      data: {},
      getState: jest.fn().mockResolvedValue('completed'),
    } as unknown as Job;
    const queue = buildMockQueue();
    (queue.getJob as jest.Mock).mockResolvedValue(mockJob);
    const helper = new QueueTestHelper(queue);
    const result = await helper.waitForJob('job-done', 2000);
    expect(result.id).toBe('job-done');
  });

  it('should throw on simulateJobCompletion when job is not found', async () => {
    const queue = buildMockQueue();
    (queue.getJob as jest.Mock).mockResolvedValue(null);
    const helper = new QueueTestHelper(queue);
    await expect(helper.simulateJobCompletion('missing')).rejects.toThrow('Job "missing" not found');
  });

  it('should call moveToCompleted on simulateJobCompletion', async () => {
    const mockJob = {
      id: 'job-complete',
      moveToCompleted: jest.fn().mockResolvedValue(undefined),
    } as unknown as Job;
    const queue = buildMockQueue();
    (queue.getJob as jest.Mock).mockResolvedValue(mockJob);
    const helper = new QueueTestHelper(queue);
    await helper.simulateJobCompletion('job-complete');
    expect(mockJob.moveToCompleted).toHaveBeenCalledWith({ success: true }, 'test-token', false);
  });

  it('should call moveToFailed on simulateJobFailure', async () => {
    const mockJob = {
      id: 'job-fail',
      moveToFailed: jest.fn().mockResolvedValue(undefined),
    } as unknown as Job;
    const queue = buildMockQueue();
    (queue.getJob as jest.Mock).mockResolvedValue(mockJob);
    const helper = new QueueTestHelper(queue);
    await helper.simulateJobFailure('job-fail', new Error('test error'));
    expect(mockJob.moveToFailed).toHaveBeenCalledWith(
      expect.any(Error),
      'test-token',
      false
    );
  });

  it('should expose the underlying queue via getQueue()', () => {
    const queue = buildMockQueue();
    const helper = new QueueTestHelper(queue);
    expect(helper.getQueue()).toBe(queue);
  });
});
