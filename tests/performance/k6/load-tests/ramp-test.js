/**
 * @fileoverview K6 Ramp Load Test
 * Gradually ramps up Virtual Users from 0 to 100 over 14 minutes and verifies SLO thresholds.
 */

import { SLO_THRESHOLDS } from '../lib/config.js';
import { runIngestScenario } from '../scenarios/ingest-scenario.js';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp to 10 VUs
    { duration: '5m', target: 50 },   // Ramp to 50 VUs
    { duration: '5m', target: 100 },  // Ramp to 100 VUs
    { duration: '2m', target: 0 },    // Cool down to 0
  ],
  thresholds: SLO_THRESHOLDS,
};

export default function () {
  runIngestScenario();
}
