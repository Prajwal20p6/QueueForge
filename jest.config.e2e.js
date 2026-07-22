'use strict';

const base = require('./tests/jest.config.base');

/**
 * Jest configuration for E2E tests.
 * Runs only *.e2e.test.ts files.
 * Serial execution (maxWorkers: 1) — E2E tests share a live server.
 */
module.exports = {
  ...base,
  displayName: 'e2e',
  testMatch: ['**/tests/**/*.e2e.test.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  runInBand: true,
  collectCoverage: false,
  reporters: [
    'default',
    ['./tests/jest-reporter.js', { showSlowTests: true, slowThresholdMs: 5000 }],
  ],
};
