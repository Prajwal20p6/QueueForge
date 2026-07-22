import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { PrismaClient } from '@prisma/client';

describe('Database Persistence Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    prisma = stack.db;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should successfully write and retrieve TaskResult record', async () => {
    const uid = `db-test-${Math.random().toString(36).substring(7)}`;
    const result = await prisma.aiTaskResult.create({
      data: {
        id: uid,
        emailId: 'db@persist.com',
        agentId: 'persist-agent',
        agentVersion: 'v1.0.0',
        resultPayload: { content: 'db data' },
        confidenceScore: 0.99,
      },
    });

    expect(result.id).toBeDefined();
    const fetched = await prisma.aiTaskResult.findUnique({ where: { id: result.id } });
    expect(fetched?.emailId).toBe('db@persist.com');
  });
});
