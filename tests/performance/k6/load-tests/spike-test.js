/**
 * @fileoverview K6 Spike Load Test
 * Tests system resilience against a sudden 200 VU traffic spike.
 */

import { SLO_THRESHOLDS } from '../lib/config.js';
import { runIngestScenario } from '../scenarios/ingest-scenario.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '30s', target: 200 }, // Sudden spike to 200 VUs
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: SLO_THRESHOLDS,
};

export default function () {
  runIngestScenario();
}
