/**
 * @fileoverview K6 Ingest Scenario
 * Tests POST /api/v1/results with varying payload sizes (1KB to 100KB).
 */

import http from 'k6/http';
import { BASE_URL, DEFAULT_HEADERS } from '../lib/config.js';
import { generateTaskResultPayload } from '../lib/utils.js';
import { assertIngestResponse } from '../lib/assertions.js';
import { customMetrics } from '../lib/metrics.js';

export function runIngestScenario() {
  const payloadSize = Math.floor(Math.random() * 99) + 1; // 1KB to 100KB
  const body = JSON.stringify(generateTaskResultPayload(payloadSize));

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/results`, body, { headers: DEFAULT_HEADERS });
  const duration = Date.now() - startTime;

  customMetrics.ingestDuration.add(duration);
  const success = assertIngestResponse(res);
  customMetrics.errorRate.add(!success);

  return res;
}

export default function () {
  runIngestScenario();
}
