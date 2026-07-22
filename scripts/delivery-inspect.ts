import { PrismaClient } from '@prisma/client';

/**
 * Command-line utility tool to query database lineage and delivery state logs.
 *
 * Usage:
 * ```bash
 * ts-node scripts/delivery-inspect.ts [command] [args...]
 * ```
 */
async function runDeliveryInspector(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const prisma = new PrismaClient();

  try {
    switch (command) {
      case 'delivery': {
        const deliveryId = args[1];
        if (!deliveryId) {
          console.error('[Delivery-Inspect] Error: Missing deliveryId');
          process.exit(1);
        }
        console.log(`[Delivery-Inspect] Querying details for deliveryId: "${deliveryId}"...`);
        const delivery = await prisma.taskResultDelivery.findUnique({
          where: { id: deliveryId },
          include: { attempts: true },
        });
        console.log(JSON.stringify(delivery, null, 2));
        break;
      }
      case 'result': {
        const resultId = args[1];
        if (!resultId) {
          console.error('[Delivery-Inspect] Error: Missing resultId');
          process.exit(1);
        }
        console.log(`[Delivery-Inspect] Querying deliveries for resultId: "${resultId}"...`);
        const result = await prisma.aiTaskResult.findUnique({
          where: { id: resultId },
          include: { deliveries: true },
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case 'email': {
        const emailId = args[1];
        if (!emailId) {
          console.error('[Delivery-Inspect] Error: Missing emailId');
          process.exit(1);
        }
        console.log(`[Delivery-Inspect] Querying lineage trace for emailId: "${emailId}"...`);
        const results = await prisma.aiTaskResult.findMany({
          where: { emailId },
          include: { deliveries: true },
        });
        console.log(JSON.stringify(results, null, 2));
        break;
      }
      case 'dlq': {
        console.log('[Delivery-Inspect] Querying failed delivery logs (status FAILED_DLQ)...');
        const failed = await prisma.taskResultDelivery.findMany({
          where: { status: 'FAILED_DLQ' },
          take: 50,
        });
        console.log(JSON.stringify(failed, null, 2));
        break;
      }
      case 'retry': {
        const deliveryId = args[1];
        if (!deliveryId) {
          console.error('[Delivery-Inspect] Error: Missing deliveryId to retry');
          process.exit(1);
        }
        console.log(`[Delivery-Inspect] Resetting deliveryId "${deliveryId}" status to PENDING...`);
        const updated = await prisma.taskResultDelivery.update({
          where: { id: deliveryId },
          data: { status: 'PENDING', retryCount: 0 },
        });
        console.log(JSON.stringify(updated, null, 2));
        break;
      }
      default:
        console.log(`
QueueForge Delivery Database Inspector CLI
Usage: ts-node scripts/delivery-inspect.ts [command] [args...]

Commands:
  delivery [id]    View delivery details and attempt logs
  result [id]      View all deliveries for a specific AI Task Result
  email [address]  Query delivery history and lineage logs by email ID
  dlq              List failed webhook deliveries (status FAILED_DLQ)
  retry [id]       Force retry a failed webhook delivery by resetting its status
        `);
        break;
    }
  } catch (err: any) {
    console.error(`[Delivery-Inspect] Error during execution: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  runDeliveryInspector().then(() => process.exit(0));
}

// Export for unit tests
export { runDeliveryInspector };
