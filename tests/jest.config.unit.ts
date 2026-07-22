import type { Config } from 'jest';
import baseConfig from './jest.config.base';

/**
 * Unit test configuration for isolated component testing.
 */
const config: Config = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};

export default config;
