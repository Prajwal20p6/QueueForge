import { PrismaClient, DestinationType } from '@prisma/client';
import { Logger } from '../observability/logging/logger';

/**
 * Seeds sample/default data into the Postgres database in development environments.
 *
 * @param prisma - PrismaClient instance.
 * @param logger - The logger wrapper.
 */
export async function seedDatabase(prisma: PrismaClient, logger: Logger): Promise<void> {
  logger.info('[Seeding] Checking database seeding state...');

  try {
    // 1. Seed Default Webhook Destination if empty
    const destCount = await prisma.destination.count({ where: { deletedAt: null } });
    if (destCount === 0) {
      logger.info('[Seeding] Injecting default Webhook Destination...');
      await prisma.destination.create({
        data: {
          endpointUrl: 'https://httpbin.org/post',
          destinationType: DestinationType.WEBHOOK,
          eventFilters: ['classification.billing', 'classification.support'],
          enabled: true,
        },
      });
      logger.info('[Seeding] Default webhook destination inserted successfully.');
    } else {
      logger.info('[Seeding] Webhook destinations already exist, bypassing creation.');
    }

    // 2. Seed Default Database Destination if empty
    const dbDestCount = await prisma.destination.count({
      where: { destinationType: DestinationType.DATABASE, deletedAt: null },
    });
    if (dbDestCount === 0) {
      logger.info('[Seeding] Injecting default Database Destination...');
      await prisma.destination.create({
        data: {
          endpointUrl: 'postgresql://localhost:5432/archive',
          destinationType: DestinationType.DATABASE,
          eventFilters: ['classification.retention'],
          enabled: true,
        },
      });
      logger.info('[Seeding] Default database destination inserted successfully.');
    }

    // 3. Seed Default AI Task Result if empty
    const resultCount = await prisma.aiTaskResult.count({ where: { deletedAt: null } });
    if (resultCount === 0) {
      logger.info('[Seeding] Injecting default sample AI Task Results...');
      await prisma.aiTaskResult.create({
        data: {
          emailId: 'billing@oneinbox.com',
          agentId: 'billing-classifier-v1',
          agentVersion: '1.0.0',
          resultPayload: { category: 'billing', urgency: 'high', confidence: 0.98 },
          confidenceScore: 0.98,
        },
      });
      logger.info('[Seeding] Default task results inserted successfully.');
    }

    logger.info('[Seeding] Database seeding run finished successfully.');
  } catch (err: any) {
    logger.error('[Seeding] Seeding run failed!', err);
    throw err;
  }
}
