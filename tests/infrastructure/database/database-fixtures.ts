import { PrismaClient } from '@prisma/client';

/**
 * Seeder creating test dataset for integration and E2E testing.
 */
export class DatabaseFixtures {
  constructor(private readonly prisma: PrismaClient) {}

  public async seedTestData(): Promise<void> {
    try {
      await this.prisma.destination.createMany({
        data: [
          {
            id: 'dest-webhook-1',
            type: 'WEBHOOK',
            endpoint: 'https://api.example.com/webhooks/results',
            config: {},
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        skipDuplicates: true,
      });
    } catch {
      // Ignore if table not created
    }
  }
}
