import { DestinationRepository } from '../../../src/infrastructure/repositories/destination.repository';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Destination Repository Integration', () => {
  let prisma: any;
  let repository: DestinationRepository;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = new DestinationRepository(prisma, auditLogger);
    jest.restoreAllMocks();
  });

  it('should create and retrieve destinations with URL validation checks', async () => {
    const mockRecord = {
      id: 'dest-123',
      endpointUrl: 'https://webhook.site/queueforge',
      destinationType: 'WEBHOOK',
      eventFilters: { category: 'urgent' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    jest.spyOn(prisma.destination, 'create').mockResolvedValue(mockRecord);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const record = await repository.createDestination({
      endpointUrl: 'https://webhook.site/queueforge',
      destinationType: 'WEBHOOK',
      eventFilters: { category: 'urgent' },
    });

    expect(record.id).toBe('dest-123');
    expect(prisma.destination.create).toHaveBeenCalled();
  });

  it('should throw error when URL scheme is not HTTP/HTTPS', async () => {
    await expect(
      repository.createDestination({
        endpointUrl: 'ftp://ftp.site/data',
        destinationType: 'WEBHOOK',
        eventFilters: {},
      })
    ).rejects.toThrow(/Endpoint URL must use HTTP or HTTPS scheme/);
  });

  it('should find destinations matching event filters criteria in JS', async () => {
    const mockDestinations = [
      { id: 'dest-1', eventFilters: { category: 'urgent', priority: 'high' } },
      { id: 'dest-2', eventFilters: { category: 'general' } },
    ];
    jest.spyOn(prisma.destination, 'findMany').mockResolvedValue(mockDestinations as any);

    const matched = await repository.findDestinationsByEventFilter({ category: 'urgent' });
    expect(matched.length).toBe(1);
    expect(matched[0].id).toBe('dest-1');
  });
});
