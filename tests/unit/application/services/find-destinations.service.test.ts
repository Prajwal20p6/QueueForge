import { FindDestinationsService } from '../../../../src/application/services/destination/find-destinations.service';
import { IDestinationRepository as DestinationRepository } from '../../../../src/domain/repositories/IDestinationRepository';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Destination } from '../../../../src/domain/entities/destination.entity';
import { DestinationType } from '../../../../src/domain/value-objects/destination-type';

describe('FindDestinationsService Unit Tests', () => {
  let mockDestRepo: jest.Mocked<DestinationRepository>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: FindDestinationsService;

  beforeEach(() => {
    mockDestRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new FindDestinationsService(mockDestRepo, mockLogger);
  });

  it('should return matching active destinations based on filter metadata criteria', async () => {
    const dest1 = Destination.restore({
      id: 'dest-1',
      endpointUrl: 'https://webhook.site/1',
      destinationType: DestinationType.webhook(),
      eventFilters: { type: 'invoices', value: 100 },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const dest2 = Destination.restore({
      id: 'dest-2',
      endpointUrl: 'https://webhook.site/2',
      destinationType: DestinationType.webhook(),
      eventFilters: { type: 'spam' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDestRepo.findAllActive.mockResolvedValue([dest1, dest2]);

    const res = await service.findMatching({ type: 'invoices', value: 100, other: 'data' });

    expect(res).toHaveLength(1);
    expect(res[0].getId()).toBe('dest-1');
  });
});
