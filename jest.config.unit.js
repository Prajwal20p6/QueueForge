'use strict';

const base = require('./tests/jest.config.base');

/**
 * Jest configuration for unit tests.
 * Runs all *.test.ts files (excluding integration, chaos, e2e).
 * Full parallelism for fast feedback.
 */
module.exports = {
  ...base,
  displayName: 'unit',
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/*.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.test\\.ts$',
    '\\.e2e\\.test\\.ts$',
    '\\.chaos\\.test\\.ts$',
  ],
  collectCoverage: true,
  maxWorkers: 'auto',
  testTimeout: 15000,
  reporters: [
    'default',
    ['./tests/jest-reporter.js', { showSlowTests: true, slowThresholdMs: 1000 }],
  ],
};
