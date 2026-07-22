import { initializeWorkerModule } from '../../../src/worker/worker.module';

describe('JobProcessing Integration Tests', () => {
  it('should initialize worker module and process job successfully', async () => {
    const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const mockRepos = {
      deliveries: {
        findById: jest.fn().mockResolvedValue({ id: 'del-10', destinationId: 'dest-10' }),
        updateStatus: jest.fn().mockResolvedValue({ id: 'del-10', status: 'COMPLETED' }),
      },
      destinations: {
        findById: jest.fn().mockResolvedValue({ id: 'dest-10', destinationType: 'WEBHOOK', endpoint: 'https://httpbin.org/post' }),
      },
      results: {
        findById: jest.fn().mockResolvedValue({ id: 'res-10', resultPayload: {} }),
      },
      attempts: {
        create: jest.fn().mockResolvedValue({ id: 'att-10' }),
      },
    };

    const workerModule = await initializeWorkerModule({}, { repositories: mockRepos, logger });

    const jobResult = await workerModule.processor.processJob({ id: 'job-10', data: { deliveryId: 'del-10' } });
    expect(jobResult.deliveryId).toBe('del-10');

    await workerModule.shutdown.initiate();
  });
});
