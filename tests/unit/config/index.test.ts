import { loadConfig, getConfig, resetConfig } from '../../../src/config';
import { ValidationError } from '../../../src/shared/errors/validation-error';

describe('Config Registry: index.ts', () => {
  const originalEnv = { ...process.env };
  let stdoutMock: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    resetConfig();
    process.env = { ...originalEnv };
    stdoutMock = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutMock.mockRestore();
  });

  const validEnvVars = {
    NODE_ENV: 'development',
    PORT: '3000',
    LOG_LEVEL: 'info',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/queueforge',
    REDIS_URL: 'redis://localhost:6379',
    API_KEY_SECRET: 'api_key_secret_key_secret_key_secret_key_secret_key',
    JWT_SECRET: 'jwt_secret_key_secret_key_secret_key_secret_key_secret_key',
    HMAC_SECRET: 'hmac_secret_key_secret_key_secret_key_secret_key_secret_key',
  };

  it('should compose all sub-configurations successfully', async () => {
    process.env = { ...validEnvVars };
    const config = await loadConfig();

    expect(config.app).toBeDefined();
    expect(config.database).toBeDefined();
    expect(config.queue).toBeDefined();
    expect(config.redis).toBeDefined();
    expect(config.observability).toBeDefined();
    expect(config.security).toBeDefined();
    expect(config.resilience).toBeDefined();

    expect(config.app.port).toBe(3000);
    expect(config.database.poolMax).toBeGreaterThan(0);
  });

  it('should lazy-load configuration synchronously on getConfig call', () => {
    process.env = { ...validEnvVars };
    // getConfig should run loadConfigSync internally since configInstance is null
    const config = getConfig();
    expect(config).toBeDefined();
    expect(config.app.port).toBe(3000);

    // Multiple calls should return the same singleton instance
    expect(getConfig()).toBe(config);
  });

  it('should redact sensitive parameters when printing logs during startup loading', async () => {
    process.env = { ...validEnvVars };
    await loadConfig();

    const outputLogs = stdoutMock.mock.calls.map(call => call[0]).join('\n');
    expect(outputLogs).toContain('QueueForge startup configuration parsed and validated');
    expect(outputLogs).toContain('[REDACTED]');
    expect(outputLogs).not.toContain(validEnvVars.JWT_SECRET);
    expect(outputLogs).not.toContain(validEnvVars.DATABASE_URL);
  });

  it('should fail fast on configuration validation failure', async () => {
    process.env = { ...validEnvVars, PORT: 'abc' }; // invalid port
    await expect(loadConfig()).rejects.toThrow(ValidationError);
  });
});
