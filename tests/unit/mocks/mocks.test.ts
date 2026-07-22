import { MockServiceFactory } from '../../mocks/mock-services';
import { MockRepositoryFactory } from '../../mocks/mock-repositories';
import { MockProviderFactory } from '../../mocks/mock-providers';
import { MockEventPublisher } from '../../mocks/mock-events';

describe('Mocks Infrastructure Unit Tests', () => {
  it('should instantiate mock application services with tracking functions', async () => {
    const ingestService = MockServiceFactory.createMockIngestResultService();
    const processService = MockServiceFactory.createMockProcessDeliveryService();

    await ingestService.execute({});
    await processService.execute({});

    expect(ingestService.execute).toHaveBeenCalled();
    expect(processService.execute).toHaveBeenCalled();
  });

  it('should instantiate mock repositories with mock CRUD methods', async () => {
    const repo = MockRepositoryFactory.createMockResultRepository();
    await repo.create({ id: 'test' });
    expect(repo.create).toHaveBeenCalledWith({ id: 'test' });
  });

  it('should instantiate mock providers for QueueManager and RedisOperations', async () => {
    const queueManager = MockProviderFactory.createMockQueueManager();
    const redisOps = MockProviderFactory.createMockRedisOperations();

    await queueManager.addJob({});
    await redisOps.get('key');

    expect(queueManager.addJob).toHaveBeenCalled();
    expect(redisOps.get).toHaveBeenCalledWith('key');
  });

  it('should track published events in MockEventPublisher', async () => {
    const publisher = new MockEventPublisher();
    await publisher.publish({ type: 'DELIVERY_CREATED', id: '123' });

    expect(publisher.getPublishedEvents()).toHaveLength(1);
    expect(publisher.getPublishedEvents()[0].type).toBe('DELIVERY_CREATED');

    publisher.clear();
    expect(publisher.getPublishedEvents()).toHaveLength(0);
  });
});
