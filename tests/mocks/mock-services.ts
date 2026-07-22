export class MockServiceFactory {
  public static createMockIngestResultService(): any {
    return {
      execute: jest.fn().mockResolvedValue({ id: 'res-123', status: 'INGESTED' }),
      ingestResult: jest.fn().mockResolvedValue({ id: 'res-123', status: 'INGESTED' }),
    };
  }

  public static createMockProcessDeliveryService(): any {
    return {
      execute: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
      processDelivery: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
    };
  }
}
