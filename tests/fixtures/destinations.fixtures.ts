import { createDestination } from '../factories/entity-builders';

export class DestinationFixtures {
  public static webhookDestination() {
    return createDestination({ type: 'WEBHOOK', endpoint: 'https://api.example.com/webhook' });
  }

  public static disabledDestination() {
    return createDestination({ enabled: false });
  }

  public static multipleDestinations(count: number) {
    return Array.from({ length: count }, (_, i) =>
      createDestination({ endpoint: `https://api.example.com/webhook-${i}` })
    );
  }
}
