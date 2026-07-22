import { PrismaClient } from '@prisma/client';

export class BehaviorVerifier {
  constructor(private readonly prisma: PrismaClient) {}

  public async assertDeliveryCompleted(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.taskResultDelivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery || delivery.status !== 'COMPLETED') {
      throw new Error(`Expected delivery "${deliveryId}" status to be COMPLETED, got "${delivery?.status}"`);
    }
  }
}
