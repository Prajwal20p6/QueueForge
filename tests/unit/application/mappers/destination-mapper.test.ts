import { DestinationMapper } from '../../../../src/application/mappers/destination-mapper';
import { Destination } from '../../../../src/domain/entities/destination.entity';

describe('DestinationMapper Unit Tests', () => {
  it('should map CreateDestinationRequest to Destination domain entity', () => {
    const dto = {
      endpointUrl: 'https://webhook.site/abc',
      destinationType: 'WEBHOOK' as const,
      eventFilters: { agentId: 'ai-classifier' },
      enabled: false,
    };

    const entity = DestinationMapper.toDomainEntity(dto);
    expect(entity).toBeInstanceOf(Destination);
    expect(entity.getEndpointUrl()).toBe('https://webhook.site/abc');
    expect(entity.getDestinationType().kind).toBe('webhook');
    expect(entity.isEnabled()).toBe(false);
  });

  it('should map Destination entity to response object', () => {
    const typeObj = { kind: 'webhook' as const, name: 'webhook' };
    const entity = Destination.restore({
      id: 'dest-999',
      endpointUrl: 'https://webhook.site/abc',
      destinationType: typeObj as any,
      eventFilters: { agentId: 'ai-classifier' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const res = DestinationMapper.toResponse(entity);
    expect(res.id).toBe('dest-999');
    expect(res.destinationType).toBe('WEBHOOK');
    expect(res.enabled).toBe(true);
  });
});
