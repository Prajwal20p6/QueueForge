/**
 * @fileoverview K6 Concurrency Load Test
 * High concurrency (200 VUs for 10 minutes) testing connection pool exhaustion and deadlock freedom.
 */

import { SLO_THRESHOLDS } from '../lib/config.js';
import { runIngestScenario } from '../scenarios/ingest-scenario.js';

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '8m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: SLO_THRESHOLDS,
};

export default function () {
  runIngestScenario();
}
