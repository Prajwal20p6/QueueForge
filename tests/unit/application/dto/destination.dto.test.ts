import { CreateDestinationRequest, DestinationResponse } from '../../../../src/application/dto/destination.dto';

describe('Destination DTO Verification', () => {
  it('should assert CreateDestinationRequest structures compatibility', () => {
    const request: CreateDestinationRequest = {
      endpointUrl: 'https://webhook.site/abc',
      destinationType: 'WEBHOOK',
      eventFilters: { category: 'billing' },
      enabled: true,
    };
    expect(request.destinationType).toBe('WEBHOOK');
  });

  it('should assert DestinationResponse parameters compatibility', () => {
    const response: DestinationResponse = {
      id: 'dest-999',
      endpointUrl: 'https://webhook.site/abc',
      destinationType: 'WEBHOOK',
      eventFilters: { category: 'billing' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(response.enabled).toBe(true);
    expect(response.id).toBe('dest-999');
  });
});
