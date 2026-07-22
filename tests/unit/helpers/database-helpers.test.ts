import { DatabaseTestHelper } from '../../helpers/database-helpers';
import { PrismaClient, Prisma } from '@prisma/client';

describe('DatabaseTestHelper Unit Tests', () => {
  const buildMockPrisma = (overrides: Record<string, unknown> = {}): PrismaClient => ({
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ count: BigInt(5) }]),
    $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn({ testKey: 'tx-client' })
    ),
    aiTaskResult: { create: jest.fn().mockResolvedValue({ id: 'fixture-result-001' }) },
    destination: { create: jest.fn().mockResolvedValue({ id: 'fixture-dest-webhook-001' }) },
    ...overrides,
  } as unknown as PrismaClient);

  it('should create a fixture and retrieve it by name', async () => {
    const helper = new DatabaseTestHelper(buildMockPrisma());
    const data = { id: 'manual-fixture', name: 'test' };
    await helper.createFixture('manual', data);
    const retrieved = helper.getFixture('manual');
    expect(retrieved).toEqual(data);
  });

  it('should throw an error for unknown fixture names', async () => {
    const helper = new DatabaseTestHelper(buildMockPrisma());
    expect(() => helper.getFixture('nonexistent')).toThrow(
      'Fixture "nonexistent" not found'
    );
  });

  it('should execute cleanup and truncate all tables', async () => {
    const mockPrisma = buildMockPrisma();
    const helper = new DatabaseTestHelper(mockPrisma);
    await helper.cleanup();
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'SET session_replication_role = replica;'
    );
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "AiTaskResult" CASCADE;'
    );
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      'SET session_replication_role = DEFAULT;'
    );
  });

  it('should clear fixture store after cleanup', async () => {
    const mockPrisma = buildMockPrisma();
    const helper = new DatabaseTestHelper(mockPrisma);
    await helper.createFixture('temp', { id: 'temp-123' });
    await helper.cleanup();
    expect(() => helper.getFixture('temp')).toThrow('Fixture "temp" not found');
  });

  it('should execute a transaction via $transaction', async () => {
    const mockPrisma = buildMockPrisma();
    const helper = new DatabaseTestHelper(mockPrisma);
    const result = await helper.transaction(async (tx: Prisma.TransactionClient) => {
      return (tx as any).testKey;
    });
    expect(result).toBe('tx-client');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should return numeric count from countRows', async () => {
    const helper = new DatabaseTestHelper(buildMockPrisma());
    const count = await helper.countRows('AiTaskResult');
    expect(count).toBe(5);
  });

  it('should seed default fixtures and store them', async () => {
    const mockPrisma = buildMockPrisma();
    const helper = new DatabaseTestHelper(mockPrisma);
    await helper.seed();
    const dest = helper.getFixture('destination-webhook');
    const result = helper.getFixture('ai-result');
    expect(dest).toBeDefined();
    expect(result).toBeDefined();
  });
});
