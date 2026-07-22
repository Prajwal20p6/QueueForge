import { PrismaClient } from '@prisma/client';

/**
 * Development database fixtures generator.
 * Seeds PostgreSQL with dummy AI results, destination profiles and attempt logs.
 *
 * Usage:
 * ```bash
 * ts-node scripts/dev/generate-fixtures.ts
 * ```
 */
async function generateFixtures(): Promise<void> {
  const prisma = new PrismaClient();
  console.log('[Dev-Fixtures] Starting mock fixtures database seeding...');

  try {
    // 1. Create a webhook destination
    const dest = await prisma.destination.upsert({
      where: { id: 'dev-fixture-dest-001' },
      update: {},
      create: {
        id: 'dev-fixture-dest-001',
        endpointUrl: 'https://webhook.site/queueforge-demo',
        destinationType: 'WEBHOOK',
        eventFilters: { agentIds: [] },
        enabled: true,
      },
    });
    console.log(`[Dev-Fixtures] Created Destination: ${dest.id}`);

    // 2. Create AI Task Results
    const now = new Date();
    const result1 = await prisma.aiTaskResult.create({
      data: {
        id: 'dev-fixture-result-001',
        emailId: 'demo-user@oneinbox.ai',
        agentId: 'classifier-agent',
        agentVersion: 'v1.0.0',
        resultPayload: { category: 'support', urgency: 'high' },
        confidenceScore: 0.94,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log(`[Dev-Fixtures] Created AI Task Result: ${result1.id}`);

    // 3. Create a Delivery attempt
    const delivery = await prisma.taskResultDelivery.create({
      data: {
        id: 'dev-fixture-delivery-001',
        taskResultId: result1.id,
        destinationId: dest.id,
        status: 'COMPLETED',
        retryCount: 0,
      },
    });

    // Create an AttemptLog
    await prisma.attemptLog.create({
      data: {
        deliveryId: delivery.id,
        responseCode: 200,
        responseBody: '{"status":"ok"}',
        durationMs: 145.2,
      },
    });
    console.log(`[Dev-Fixtures] Created Delivery & Attempt Logs: ${delivery.id}`);

    console.log('[Dev-Fixtures] Seeding completed successfully!');
  } catch (err: any) {
    console.error(`[Dev-Fixtures] Seeding failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  generateFixtures().then(() => process.exit(0));
}

export { generateFixtures };
