import { loadDatabaseConfig } from '../../../src/config/database.config';
import { EnvLoader } from '../../../src/config/env';

describe('Config: database.config.ts', () => {
  it('should successfully build DatabaseConfig', () => {
    // Force EnvLoader to load the .env file first
    EnvLoader.load();

    // Reset env to avoid pollution from other tests
    delete process.env.DB_POOL_MIN;
    delete process.env.DB_POOL_MAX;
    delete process.env.DATABASE_MIN_CONNECTIONS;
    delete process.env.DATABASE_MAX_CONNECTIONS;
    process.env.DATABASE_URL = 'postgresql://usr:pwd@localhost:5432/db';

    const config = loadDatabaseConfig();
    expect(config.url).toBe(process.env.DATABASE_URL);
    expect(config.maxConnections).toBe(20);
    expect(config.minConnections).toBe(5);
  });
});
