'use strict';

/**
 * Custom Jest reporter that tracks test timing, highlights slow tests,
 * and reports coverage threshold status.
 *
 * @example
 * // In jest.config.js:
 * reporters: [
 *   'default',
 *   ['./tests/jest-reporter.js', { showSlowTests: true, slowThresholdMs: 1000 }]
 * ]
 */
class QueueForgeReporter {
  constructor(_globalConfig, options = {}) {
    this._options = options;
    this._slowThresholdMs = options.slowThresholdMs ?? 1000;
    this._showSlowTests = options.showSlowTests !== false;
    this._startTime = null;
    this._suiteTimes = new Map();
    this._slowTests = [];
  }

  onRunStart(_results, _options) {
    this._startTime = Date.now();
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           QueueForge Test Suite Started          ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  }

  onTestStart(test) {
    this._suiteTimes.set(test.path, Date.now());
  }

  onTestResult(_test, testResult) {
    const startTime = this._suiteTimes.get(testResult.testFilePath) ?? Date.now();
    const duration = Date.now() - startTime;
    const suiteName = testResult.testFilePath.split(/[\\/]/).slice(-2).join('/');
    const statusIcon = testResult.numFailingTests > 0 ? '✗' : '✓';
    const statusColor = testResult.numFailingTests > 0 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';
    const durationStr = duration > this._slowThresholdMs
      ? `\x1b[33m${duration}ms\x1b[0m`
      : `${duration}ms`;

    console.log(
      `  ${statusColor}${statusIcon}${reset} ${suiteName} ${reset}(${durationStr})`
    );

    if (this._showSlowTests && duration > this._slowThresholdMs) {
      this._slowTests.push({ name: suiteName, durationMs: duration });
    }

    // Report individual slow test cases
    if (this._showSlowTests) {
      for (const testCase of testResult.testResults) {
        if ((testCase.duration ?? 0) > this._slowThresholdMs) {
          this._slowTests.push({
            name: testCase.fullName,
            durationMs: testCase.duration ?? 0,
          });
        }
      }
    }
  }

  onRunComplete(_contexts, results) {
    const totalDuration = Date.now() - (this._startTime ?? Date.now());
    const { numPassedTests, numFailedTests, numTotalTests, numTotalTestSuites } = results;

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║              QueueForge Test Report              ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Suites  : ${String(numTotalTestSuites).padStart(4)} total                          ║`);
    console.log(`║  Tests   : ${String(numTotalTests).padStart(4)} total                          ║`);
    console.log(`║  Passed  : \x1b[32m${String(numPassedTests).padStart(4)}\x1b[0m passed                         ║`);

    if (numFailedTests > 0) {
      console.log(`║  Failed  : \x1b[31m${String(numFailedTests).padStart(4)}\x1b[0m failed                         ║`);
    } else {
      console.log(`║  Failed  :    0                               ║`);
    }

    console.log(`║  Time    : ${String(totalDuration + 'ms').padStart(6)}                        ║`);
    console.log('╚══════════════════════════════════════════════════╝');

    if (this._showSlowTests && this._slowTests.length > 0) {
      const sorted = this._slowTests
        .sort((a, b) => b.durationMs - a.durationMs)
        .slice(0, 5);

      console.log('\n⚠️  Slowest Tests:');
      for (const t of sorted) {
        console.log(`   ${t.durationMs}ms  →  ${t.name}`);
      }
    }

    if (numFailedTests === 0) {
      console.log('\n\x1b[32m✅ All tests passed!\x1b[0m\n');
    } else {
      console.log(`\n\x1b[31m❌ ${numFailedTests} test(s) failed.\x1b[0m\n`);
    }
  }

  getLastError() {
    return undefined;
  }
}

module.exports = QueueForgeReporter;
