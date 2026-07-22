/**
 * Domain delivery assertions helper.
 */
export class DeliveryAssertions {
  public static assertDeliveryCompleted(delivery: any): void {
    if (!delivery || delivery.status !== 'COMPLETED') {
      throw new Error(`Expected delivery to be COMPLETED, but got status: "${delivery?.status}"`);
    }
  }

  public static assertDeliveryFailed(delivery: any): void {
    if (!delivery || (delivery.status !== 'FAILED_RETRY' && delivery.status !== 'FAILED_DLQ')) {
      throw new Error(`Expected delivery to be FAILED, but got status: "${delivery?.status}"`);
    }
  }

  public static assertDeliveryStatus(delivery: any, expectedStatus: string): void {
    if (!delivery || delivery.status !== expectedStatus) {
      throw new Error(`Expected status "${expectedStatus}", got "${delivery?.status}"`);
    }
  }
}
