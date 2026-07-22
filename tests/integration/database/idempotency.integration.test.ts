import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { PrismaClient } from '@prisma/client';

describe('Database Idempotency Key Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    prisma = stack.db;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should prevent insert of duplicate idempotency key via unique constraints', async () => {
    const compositeId = `idempotent-key-${Math.random().toString(36).substring(7)}`;

    await prisma.aiTaskResult.create({
      data: {
        id: compositeId,
        emailId: 'idempotent@test.com',
        agentId: 'idempotent-agent',
        agentVersion: '1.0',
        resultPayload: { info: 'idempotent first run' },
        confidenceScore: 0.90,
      },
    });

    // Expect unique key constraint failure
    await expect(
      prisma.aiTaskResult.create({
        data: {
          id: compositeId,
          emailId: 'idempotent@test.com',
          agentId: 'idempotent-agent',
          agentVersion: '1.0',
          resultPayload: { info: 'idempotent duplicate run' },
          confidenceScore: 0.90,
        },
      })
    ).rejects.toThrow();
  });
});
