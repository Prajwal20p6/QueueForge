/**
 * @fileoverview K6 Realistic Mix Load Test
 * Simulates real user traffic (60% ingest, 30% delivery search, 10% admin operations) ramping from 0 to 100 VUs over 20 minutes.
 */

import { SLO_THRESHOLDS } from '../lib/config.js';
import { runMixedScenario } from '../scenarios/mixed-scenario.js';

export const options = {
  stages: [
    { duration: '3m', target: 20 },
    { duration: '5m', target: 50 },
    { duration: '10m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: SLO_THRESHOLDS,
};

export default function () {
  runMixedScenario();
}
