import { Environment, getCurrentEnvironment, isProduction, isDevelopment, isTest, isStaging } from '../../../src/config/environment';

describe('Config: environment.ts', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should detect current environment and flags correctly', () => {
    process.env.NODE_ENV = 'production';
    expect(getCurrentEnvironment()).toBe(Environment.PRODUCTION);
    expect(isProduction()).toBe(true);
    expect(isDevelopment()).toBe(false);

    process.env.NODE_ENV = 'development';
    expect(getCurrentEnvironment()).toBe(Environment.DEVELOPMENT);
    expect(isDevelopment()).toBe(true);

    process.env.NODE_ENV = 'test';
    expect(getCurrentEnvironment()).toBe(Environment.TEST);
    expect(isTest()).toBe(true);

    process.env.NODE_ENV = 'staging';
    expect(getCurrentEnvironment()).toBe(Environment.STAGING);
    expect(isStaging()).toBe(true);
  });

  it('should throw error on invalid NODE_ENV', () => {
    process.env.NODE_ENV = 'invalid';
    expect(() => getCurrentEnvironment()).toThrow();
  });
});
