import {
  initializeRepositories,
  getRepositories,
  repositories,
  RepositoryFactory,
} from '../../../src/infrastructure/repositories/index';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Repositories Registry Index Integration', () => {
  let prisma: any;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    jest.restoreAllMocks();
  });

  it('should instantiate all five repositories using RepositoryFactory.create', async () => {
    const registry = await RepositoryFactory.create(prisma, auditLogger);

    expect(registry.results).toBeDefined();
    expect(registry.deliveries).toBeDefined();
    expect(registry.destinations).toBeDefined();
    expect(registry.attempts).toBeDefined();
    expect(registry.auditLogs).toBeDefined();
  });

  it('should initialize repositories singleton and export getRepositories correctly', async () => {
    const initialized = await initializeRepositories(prisma, auditLogger);
    expect(initialized).toBe(repositories);

    const retrieved = getRepositories();
    expect(retrieved).toBe(repositories);
  });
});
