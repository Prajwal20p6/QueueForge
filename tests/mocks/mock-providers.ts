export class MockProviderFactory {
  public static createMockQueueManager(): any {
    return {
      addJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getQueueStats: jest.fn().mockResolvedValue({ main: 0, delayed: 0, dlq: 0 }),
      close: jest.fn().mockResolvedValue(undefined),
    };
  }

  public static createMockRedisOperations(): any {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      close: jest.fn().mockResolvedValue(undefined),
    };
  }
}
