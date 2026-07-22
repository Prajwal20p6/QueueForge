/**
 * @fileoverview K6 Endurance Load Test
 * Sustained 50 VUs load for 8 hours to evaluate GC behavior, thread pool stability, and memory footprint.
 */

import { STRICT_SLO_THRESHOLDS } from '../lib/config.js';
import { runMixedScenario } from '../scenarios/mixed-scenario.js';

export const options = {
  stages: [
    { duration: '10m', target: 50 },
    { duration: '7h40m', target: 50 }, // 8 hours duration total
    { duration: '10m', target: 0 },
  ],
  thresholds: STRICT_SLO_THRESHOLDS,
};

export default function () {
  runMixedScenario();
}
