import type { Config } from 'jest';
import baseConfig from './jest.config.base';

/**
 * End-to-End test configuration for full workflow verification.
 */
const config: Config = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  testTimeout: 60000,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};

export default config;
