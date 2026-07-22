import { RegisterDestinationService } from '../../../../src/application/services/destination/register-destination.service';
import { IDestinationRepository as DestinationRepository } from '../../../../src/domain/repositories/IDestinationRepository';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Destination } from '../../../../src/domain/entities/destination.entity';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('RegisterDestinationService Unit Tests', () => {
  let mockDestRepo: jest.Mocked<DestinationRepository>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: RegisterDestinationService;

  beforeEach(() => {
    mockDestRepo = {
      save: jest.fn().mockImplementation(async d => d),
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

    service = new RegisterDestinationService(mockDestRepo, mockLogger, {});
  });

  it('should successfully register a valid webhook destination and return DTO response', async () => {
    const request = {
      endpointUrl: 'https://api.myinbox.com/incoming',
      destinationType: 'WEBHOOK' as const,
      eventFilters: { category: 'financial' },
      enabled: true,
    };

    const res = await service.register(request);

    expect(res.id).toBeDefined();
    expect(res.endpointUrl).toBe('https://api.myinbox.com/incoming');
    expect(res.destinationType).toBe('WEBHOOK');
    expect(res.enabled).toBe(true);

    expect(mockDestRepo.save).toHaveBeenCalledWith(expect.any(Destination));
  });

  it('should throw ValidationError if endpoint URL fails validation checks', async () => {
    const request = {
      endpointUrl: 'ftp://bad-protocol.com',
      destinationType: 'WEBHOOK' as const,
    };

    await expect(service.register(request)).rejects.toThrow(ValidationError);
  });
});
