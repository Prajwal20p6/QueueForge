/**
 * @fileoverview K6 Mixed Workload Scenario
 * Combines ingest (60%), search (30%), and admin (10%) operations into a realistic load pattern.
 */

import { runIngestScenario } from './ingest-scenario.js';
import { runSearchScenario } from './search-scenario.js';
import { runAdminScenario } from './admin-scenario.js';

export function runMixedScenario() {
  const rand = Math.random();
  if (rand < 0.60) {
    runIngestScenario();
  } else if (rand < 0.90) {
    runSearchScenario();
  } else {
    runAdminScenario();
  }
}

export default function () {
  runMixedScenario();
}
