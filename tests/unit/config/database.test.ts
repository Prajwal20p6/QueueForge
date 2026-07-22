import { getDatabaseConfig } from '../../../src/config/database';
import { EnvConfig } from '../../../src/config/env';

describe('Config: database.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://usr:pwd@localhost:5432/db',
    WORKER_CONCURRENCY: 10,
    DB_POOL_MIN: 2,
    DB_POOL_MAX: 5,
  };

  it('should correctly configure database properties from valid env', () => {
    const config = getDatabaseConfig(baseMockEnv as EnvConfig);
    expect(config.url).toBe(baseMockEnv.DATABASE_URL);
    expect(config.poolMin).toBe(2);
    // Max should be at least WORKER_CONCURRENCY (10) + 2 = 12 because DB_POOL_MAX (5) is smaller
    expect(config.poolMax).toBe(12);
    expect(config.enableLogging).toBe(true); // getDatabaseConfig enables logging only when NODE_ENV === 'development'
  });

  it('should throw error for non-postgres database url schemes', () => {
    const badEnv = {
      ...baseMockEnv,
      DATABASE_URL: 'mysql://localhost:3306/db',
    };
    expect(() => getDatabaseConfig(badEnv as EnvConfig)).toThrow(/Invalid DATABASE_URL/);
  });

  it('should freeze the returned database config object', () => {
    const config = getDatabaseConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any).url = 'new-url';
    }).toThrow();
  });
});
