import { QueueReconstructor } from '../../../../src/daemon/recovery/queue-reconstructor';

describe('QueueReconstructor Unit Tests', () => {
  let reconstructor: QueueReconstructor;
  let mockDeliveryRepo: any;
  let mockMainQueue: any;
  let mockDelayedQueue: any;
  let mockQueueManager: any;

  beforeEach(() => {
    mockDeliveryRepo = {
      findByStatus: jest.fn().mockImplementation(status => {
        if (status === 'PENDING') return Promise.resolve([{ id: 'del-pending-1' }]);
        if (status === 'SCHEDULED_RETRY') return Promise.resolve([{ id: 'del-retry-1', nextRetryAt: new Date() }]);
        return Promise.resolve([]);
      }),
      findById: jest.fn().mockImplementation(id => (id === 'del-pending-1' ? { id } : null)),
    };

    mockMainQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJobs: jest.fn().mockResolvedValue([{ id: 'del-pending-1' }, { id: 'del-orphaned', remove: jest.fn() }]),
    };

    mockDelayedQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
    };

    mockQueueManager = {
      getMainQueue: () => mockMainQueue,
      getDelayedQueue: () => mockDelayedQueue,
    };

    reconstructor = new QueueReconstructor(mockDeliveryRepo, mockQueueManager);
  });

  it('should re-enqueue pending deliveries', async () => {
    const count = await reconstructor.enqueuePending();
    expect(count).toBe(1);
    expect(mockMainQueue.add).toHaveBeenCalledWith('deliver', expect.objectContaining({ deliveryId: 'del-pending-1' }));
  });

  it('should re-enqueue scheduled retry deliveries', async () => {
    const count = await reconstructor.enqueueScheduledRetries();
    expect(count).toBe(1);
    expect(mockDelayedQueue.add).toHaveBeenCalled();
  });

  it('should remove orphaned jobs from main queue', async () => {
    const removed = await reconstructor.removeOrphaned();
    expect(removed).toBe(1);
  });

  it('should execute full reconstruct flow idempotently', async () => {
    const result = await reconstructor.reconstruct();
    expect(result.enqueued).toBe(2);
    expect(result.deleted).toBe(1);
  });
});
