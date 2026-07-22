import type { Config } from 'jest';
import baseConfig from './jest.config.base';

/**
 * Integration test configuration for database, redis, and queue testing.
 */
const config: Config = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  testTimeout: 30000,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
