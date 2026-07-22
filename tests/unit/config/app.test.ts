import {
  getAppConfig,
  APP_NAME,
  APP_VERSION,
  DEFAULT_PORT,
  DEFAULT_HOSTNAME,
} from '../../../src/config/app';
import { EnvConfig } from '../../../src/config/env';

describe('Config: app.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    PORT: 3500,
    LOG_LEVEL: 'info',
    APP_NAME: 'QueueForge',
    APP_VERSION: '1.0.0',
    ENVIRONMENT: 'dev-env',
  };

  it('should export correct application defaults constants', () => {
    expect(APP_NAME).toBe('QueueForge');
    expect(APP_VERSION).toBe('1.0.0');
    expect(DEFAULT_PORT).toBe(3000);
    expect(DEFAULT_HOSTNAME).toBe('localhost');
  });

  it('should build AppConfig and set correct parameters and environment flags', () => {
    const config = getAppConfig(baseMockEnv as EnvConfig);
    expect(config.name).toBe('QueueForge');
    expect(config.version).toBe('1.0.0');
    expect(config.port).toBe(3500);
    expect(config.environment).toBe('dev-env');
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.isTest).toBe(false);
  });

  it('should trigger isProduction when NODE_ENV is production', () => {
    const prodEnv = {
      ...baseMockEnv,
      NODE_ENV: 'production',
    };
    const config = getAppConfig(prodEnv as EnvConfig);
    expect(config.isDevelopment).toBe(false);
    expect(config.isProduction).toBe(true);
  });

  it('should throw error for invalid port ranges', () => {
    const badPort = { ...baseMockEnv, PORT: 75000 };
    expect(() => getAppConfig(badPort as EnvConfig)).toThrow(/port must be/i);
  });

  it('should freeze the returned config object', () => {
    const config = getAppConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
