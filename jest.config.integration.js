'use strict';

const base = require('./tests/jest.config.base');

/**
 * Jest configuration for integration tests.
 * Runs only *.integration.test.ts files.
 * Sequential execution (maxWorkers: 2) due to shared database state.
 */
module.exports = {
  ...base,
  displayName: 'integration',
  testMatch: ['**/tests/**/*.integration.test.ts'],
  testTimeout: 30000,
  maxWorkers: 2,
  collectCoverage: false,
  reporters: [
    'default',
    ['./tests/jest-reporter.js', { showSlowTests: true, slowThresholdMs: 5000 }],
  ],
  globalSetup: undefined,
  globalTeardown: undefined,
};
