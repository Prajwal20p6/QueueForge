'use strict';

const base = require('./tests/jest.config.base');

/**
 * Jest configuration for chaos tests.
 * Runs only *.chaos.test.ts files.
 * Strictly serial (maxWorkers: 1) — chaos tests must not run in parallel.
 */
module.exports = {
  ...base,
  displayName: 'chaos',
  testMatch: ['**/tests/**/*.chaos.test.ts'],
  testTimeout: 60000,
  maxWorkers: 1,
  runInBand: true,
  collectCoverage: false,
  reporters: [
    'default',
    ['./tests/jest-reporter.js', { showSlowTests: true, slowThresholdMs: 10000 }],
  ],
};
