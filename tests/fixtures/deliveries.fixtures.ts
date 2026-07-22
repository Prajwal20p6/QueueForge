import { createDelivery } from '../factories/entity-builders';

export class DeliveryFixtures {
  public static pendingDelivery() {
    return createDelivery({ status: 'PENDING', retryCount: 0 });
  }

  public static processingDelivery() {
    return createDelivery({ status: 'PROCESSING', retryCount: 0 });
  }

  public static completedDelivery() {
    return createDelivery({ status: 'COMPLETED', retryCount: 1 });
  }

  public static failedDlqDelivery() {
    return createDelivery({ status: 'FAILED_DLQ', retryCount: 5 });
  }

  public static deliveriesByStatus(status: any, count: number) {
    return Array.from({ length: count }, () => createDelivery({ status }));
  }
}
