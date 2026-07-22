/**
 * @fileoverview K6 Soak Load Test
 * Sustained moderate load (10 VUs) for 24 hours to detect memory leaks and resource degradation.
 */

import { STRICT_SLO_THRESHOLDS } from '../lib/config.js';
import { runMixedScenario } from '../scenarios/mixed-scenario.js';

export const options = {
  stages: [
    { duration: '5m', target: 10 },
    { duration: '23h50m', target: 10 }, // 24 hours duration total
    { duration: '5m', target: 0 },
  ],
  thresholds: STRICT_SLO_THRESHOLDS,
};

export default function () {
  runMixedScenario();
}
