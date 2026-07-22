import { PrismaClient, Prisma } from '@prisma/client';

/** Map of named test fixtures loaded via createFixture/getFixture. */
type FixtureStore = Map<string, unknown>;

/**
 * Provides database setup and teardown utilities for test suites.
 * Wraps Prisma operations with transactional helpers and fixture management.
 *
 * @example
 * ```typescript
 * const db = new DatabaseTestHelper(prisma);
 * await db.cleanup();          // truncate all tables before test
 * await db.seed();             // insert default fixtures
 * const dest = db.getFixture('destination-webhook');
 * ```
 */
export class DatabaseTestHelper {
  private readonly prisma: PrismaClient;
  private readonly fixtures: FixtureStore = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Seeds the test database with a minimal set of default fixtures:
   * one destination and one AI task result.
   */
  public async seed(): Promise<void> {
    const now = new Date();

    const destination = await this.prisma.destination.create({
      data: {
        id: 'fixture-dest-webhook-001',
        endpointUrl: 'https://webhook.example.com/ingest',
        destinationType: 'WEBHOOK',
        eventFilters: { agentIds: [] },
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    this.fixtures.set('destination-webhook', destination);

    const result = await this.prisma.aiTaskResult.create({
      data: {
        id: 'fixture-result-001',
        emailId: 'test@oneinbox.ai',
        agentId: 'classifier-agent',
        agentVersion: 'v1.0.0',
        resultPayload: { category: 'billing', urgency: 'low' },
        confidenceScore: 0.87,
        createdAt: now,
        updatedAt: now,
      },
    });
    this.fixtures.set('ai-result', result);
  }

  /**
   * Truncates all application tables in dependency-safe order.
   * Resets auto-increment sequences where applicable.
   */
  public async cleanup(): Promise<void> {
    // Disable FK checks, truncate in dependency order, re-enable
    await this.prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "AttemptLog" CASCADE;');
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "TaskResultDelivery" CASCADE;');
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "AiTaskResult" CASCADE;');
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "Destination" CASCADE;');
    await this.prisma.$executeRawUnsafe('TRUNCATE TABLE "AuditLog" CASCADE;');
    await this.prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    this.fixtures.clear();
  }

  /**
   * Retrieves a named fixture previously stored via seed() or createFixture().
   * @param name - Fixture key identifier.
   * @throws {Error} if fixture is not found.
   */
  public getFixture(name: string): unknown {
    const fixture = this.fixtures.get(name);
    if (fixture === undefined) {
      throw new Error(
        `[DatabaseTestHelper] Fixture "${name}" not found. Available: [${Array.from(this.fixtures.keys()).join(', ')}]`
      );
    }
    return fixture;
  }

  /**
   * Creates and stores a named fixture using a raw data object.
   * @param name - Identifier to store the fixture under.
   * @param data - Raw record data to persist.
   */
  public async createFixture(name: string, data: Record<string, unknown>): Promise<unknown> {
    this.fixtures.set(name, data);
    return data;
  }

  /**
   * Executes a callback within a Prisma interactive transaction.
   * @param callback - Async function receiving the transaction client.
   */
  public async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx);
    });
  }

  /**
   * Returns the total row count of any Prisma-managed table by raw SQL.
   * @param tableName - SQL table name (quoted string).
   */
  public async countRows(tableName: string): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return Number(result[0]?.count ?? 0);
  }
}
