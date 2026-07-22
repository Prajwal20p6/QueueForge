import { PrismaClient, DestinationType, DeliveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the database with sample test data.
 * Safe to run multiple times (idempotent).
 */
export async function seed(): Promise<void> {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  if (nodeEnv === 'production') {
    process.stdout.write('[Seed] Skipped seeding: Node environment is production\n');
    return;
  }

  process.stdout.write('[Seed] Starting database seeding...\n');

  // Clean old records
  await prisma.auditLog.deleteMany({});
  await prisma.idempotencyCache.deleteMany({});
  await prisma.taskResultDeliveryAttempt.deleteMany({});
  await prisma.taskResultDelivery.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.aiTaskResult.deleteMany({});

  // 1. Seed 5 sample destinations
  const destinationsData = [
    {
      destinationType: DestinationType.WEBHOOK,
      endpointUrl: 'https://webhook.site/queueforge-prod-primary',
      eventFilters: { category: 'urgent' },
      enabled: true,
      retryStrategy: 'exponential',
      circuitBreakerThreshold: 5,
      timeout: 5000,
      metadata: { headers: { 'Authorization': 'Bearer token123' } },
    },
    {
      destinationType: DestinationType.WEBHOOK,
      endpointUrl: 'https://webhook.site/queueforge-prod-backup',
      eventFilters: { category: 'urgent' },
      enabled: true,
      retryStrategy: 'exponential',
      circuitBreakerThreshold: 5,
      timeout: 10000,
      metadata: { headers: { 'Authorization': 'Bearer backup123' } },
    },
    {
      destinationType: DestinationType.DATABASE,
      endpointUrl: 'postgresql://replica:replica_pass@db-replica:5432/reporting',
      eventFilters: { category: 'general' },
      enabled: true,
      retryStrategy: 'fixed',
      circuitBreakerThreshold: 3,
      timeout: 15000,
      metadata: { tableName: 'ai_insights' },
    },
    {
      destinationType: DestinationType.QUEUE,
      endpointUrl: 'bullmq:jobs:reporting-queue',
      eventFilters: undefined,
      enabled: true,
      retryStrategy: 'linear',
      circuitBreakerThreshold: 5,
      timeout: 3000,
      metadata: { prefix: 'bull' },
    },
    {
      destinationType: DestinationType.AUDIT,
      endpointUrl: 'https://audit.oneinbox.com/ingest',
      eventFilters: { severity: 'high' },
      enabled: false,
      retryStrategy: 'fixed',
      circuitBreakerThreshold: 10,
      timeout: 2000,
      metadata: { logFormat: 'json' },
    },
  ];

  const destinations = [];
  for (const d of destinationsData) {
    const created = await prisma.destination.create({ data: d });
    destinations.push(created);
  }
  process.stdout.write(`[Seed] Created ${destinations.length} destinations.\n`);

  // 2. Seed 10 sample AI task results
  const resultsData = Array.from({ length: 10 }).map((_, idx) => ({
    emailId: `user-${idx + 1}@oneinbox.com`,
    agentId: idx % 2 === 0 ? 'agent-classifier' : 'agent-summarizer',
    agentVersion: `v1.${idx}.0`,
    resultPayload: {
      category: idx % 2 === 0 ? 'urgent' : 'general',
      sentiment: idx % 3 === 0 ? 'positive' : 'negative',
      summary: `Sample text summary for AI task result number ${idx + 1}`,
      tokensUsed: 150 + idx * 50,
    },
    confidenceScore: 0.75 + idx * 0.02,
    llmMetadata: {
      model: 'gemini-1.5-pro',
      promptTokens: 1000,
      completionTokens: 200 + idx * 10,
      latencyMs: 800 + idx * 100,
    },
  }));

  const results = [];
  for (const r of resultsData) {
    const created = await prisma.aiTaskResult.create({ data: r });
    results.push(created);
  }
  process.stdout.write(`[Seed] Created ${results.length} AI task results.\n`);

  // 3. Seed 20 sample deliveries in various states
  // We link AI results to destinations
  const statuses = [
    DeliveryStatus.PENDING,
    DeliveryStatus.PROCESSING,
    DeliveryStatus.COMPLETED,
    DeliveryStatus.SCHEDULED_RETRY,
    DeliveryStatus.FAILED_DLQ,
  ];

  let deliveryCount = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    // Link each result to 2 destinations to reach 20 deliveries
    for (let j = 0; j < 2; j++) {
      const dest = destinations[(i + j) % destinations.length];
      const status = statuses[deliveryCount % statuses.length];
      
      const nextRetryAt = status === DeliveryStatus.SCHEDULED_RETRY 
        ? new Date(Date.now() + 60000) 
        : null;

      const completedAt = status === DeliveryStatus.COMPLETED 
        ? new Date() 
        : null;

      const lastError = status === DeliveryStatus.FAILED_DLQ || status === DeliveryStatus.SCHEDULED_RETRY
        ? 'Connection reset by peer'
        : null;

      const errorCategory = lastError ? 'NETWORK_ERROR' : null;

      const delivery = await prisma.taskResultDelivery.create({
        data: {
          taskResultId: result.id,
          destinationId: dest.id,
          status,
          retryCount: status === DeliveryStatus.COMPLETED ? 1 : 0,
          nextRetryAt,
          lastAttemptAt: status !== DeliveryStatus.PENDING ? new Date() : null,
          lastError,
          errorCategory,
          completedAt,
        },
      });

      // Add a delivery attempt if not pending
      if (status !== DeliveryStatus.PENDING) {
        await prisma.taskResultDeliveryAttempt.create({
          data: {
            deliveryId: delivery.id,
            attemptNumber: 1,
            responseStatus: status === DeliveryStatus.COMPLETED ? 200 : 500,
            responseTimeMs: 150,
            requestHeaders: { 'Content-Type': 'application/json' },
            responseHeaders: status === DeliveryStatus.COMPLETED 
              ? { 'Content-Type': 'application/json' } 
              : { 'Content-Length': '0' },
            errorMessage: lastError,
            errorStack: lastError ? 'Error: Connection reset\n    at Socket.destroy (node:net:360)' : null,
          },
        });
      }

      deliveryCount++;
    }
  }
  process.stdout.write(`[Seed] Created ${deliveryCount} deliveries and attempts.\n`);

  // 4. Seed sample audit log entries
  const auditLogsData = [
    {
      eventType: 'RESULT_INGESTED',
      entityType: 'AiTaskResult',
      entityId: results[0].id,
      actorId: 'system-daemon',
      action: 'CREATE',
      changes: { old: {}, new: { emailId: results[0].emailId } },
      ipAddress: '127.0.0.1',
      userAgent: 'QueueForge-Daemon/1.0.0',
    },
    {
      eventType: 'DELIVERY_COMPLETED',
      entityType: 'TaskResultDelivery',
      entityId: results[0].id,
      actorId: 'webhook-worker',
      action: 'UPDATE',
      changes: { old: { status: 'PENDING' }, new: { status: 'COMPLETED' } },
      ipAddress: '127.0.0.1',
      userAgent: 'QueueForge-Worker/1.0.0',
    },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log });
  }
  process.stdout.write(`[Seed] Created ${auditLogsData.length} audit logs.\n`);

  process.stdout.write('[Seed] Seeding completed successfully.\n');
}

// Running script directly if triggered from CLI
const isDirect = process.argv[1] && (process.argv[1].includes('seed.ts') || process.argv[1].includes('seed.js'));
if (isDirect) {
  seed()
    .catch((e) => {
      process.stderr.write(`[Seed Error] Seeding failed: ${e.message}\n`);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
