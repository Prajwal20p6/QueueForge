/**
 * Migrations Integration Test
 * Tests the runMigrations function with mocked prisma client and execSync.
 */
import { runMigrations } from '../../../src/bootstrap/migrations';

jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue('Prisma schema loaded from prisma/schema.prisma\n1 migration applied.'),
}));

describe('Migrations Integration Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([
      { migration_name: '20240101_init', applied_steps_count: 1 },
    ]),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('should execute prisma migrate deploy and return executed migrations', async () => {
    const result = await runMigrations(mockPrisma, mockLogger as any, 'development');
    expect(result.pending).toBe(0);
    expect(result.executed).toContain('20240101_init');
  });

  it('should log migration progress', async () => {
    await runMigrations(mockPrisma, mockLogger as any, 'test');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[Migrations] Triggering schema migrations deployment')
    );
  });

  it('should throw and log error when execSync fails', async () => {
    const { execSync } = require('child_process');
    execSync.mockImplementationOnce(() => { throw new Error('Migration lock timeout'); });

    await expect(
      runMigrations(mockPrisma, mockLogger as any, 'development')
    ).rejects.toThrow('Migration lock timeout');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[Migrations] Database migrations execution failed!',
      expect.any(Error)
    );
  });
});
