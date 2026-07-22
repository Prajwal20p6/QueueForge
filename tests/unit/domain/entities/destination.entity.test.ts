import { Destination } from '../../../../src/domain/entities/destination.entity';
import { DestinationType, DestinationTypeVO } from '../../../../src/domain/value-objects/destination-type.vo';
import { RetryStrategyVO } from '../../../../src/domain/value-objects/retry-strategy.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('Destination Entity Unit Tests', () => {
  it('should instantiate Destination entity and evaluate event filter matching', () => {
    const dest = Destination.create(
      DestinationTypeVO.create(DestinationType.WEBHOOK),
      'https://api.example.com/webhooks',
      RetryStrategyVO.exponential(1000, 30000),
      5,
      10000,
      { category: 'FINANCE' },
      { owner: 'team-billing' }
    );

    expect(dest.getId()).toBeDefined();
    expect(dest.getType().isWebhook()).toBe(true);
    expect(dest.getEndpoint()).toBe('https://api.example.com/webhooks');
    expect(dest.isEnabled()).toBe(true);

    expect(dest.matchesEventFilter({ category: 'FINANCE', amount: 500 })).toBe(true);
    expect(dest.matchesEventFilter({ category: 'HEALTH' })).toBe(false);
  });

  it('should throw ValidationError if webhook endpoint does not start with http/https', () => {
    expect(() =>
      Destination.create(
        DestinationTypeVO.create(DestinationType.WEBHOOK),
        'ftp://invalid-url.com',
        RetryStrategyVO.fixed(1000)
      )
    ).toThrow(ValidationError);
  });
});
