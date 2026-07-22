/**
 * @fileoverview K6 Stress Load Test
 * Increases load in steps up to 1600 VUs to determine system breaking point.
 */

import { SLO_THRESHOLDS } from '../lib/config.js';
import { runIngestScenario } from '../scenarios/ingest-scenario.js';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 800 },
    { duration: '2m', target: 1600 },
  ],
  thresholds: {
    ...SLO_THRESHOLDS,
    http_req_failed: ['rate<0.05'], // Allow up to 5% failure under extreme stress
  },
};

export default function () {
  runIngestScenario();
}
