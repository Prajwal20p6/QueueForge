export class MockRepositoryFactory {
  public static createMockResultRepository(): any {
    return {
      create: jest.fn().mockResolvedValue({ id: 'res-id' }),
      findById: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    };
  }

  public static createMockDeliveryRepository(): any {
    return {
      create: jest.fn().mockResolvedValue({ id: 'del-id' }),
      findById: jest.fn().mockResolvedValue(null),
      updateStatus: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
    };
  }
}
