/**
 * @fileoverview K6 Search Scenario
 * Tests GET /admin/deliveries query filtering, sorting, and pagination performance.
 */

import http from 'k6/http';
import { BASE_URL, DEFAULT_HEADERS } from '../lib/config.js';
import { assertSuccessResponse } from '../lib/assertions.js';
import { customMetrics } from '../lib/metrics.js';

export function runSearchScenario() {
  const statuses = ['COMPLETED', 'FAILED_RETRY', 'FAILED_DLQ', 'PENDING'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const url = `${BASE_URL}/admin/deliveries?status=${status}&page=1&limit=20&sort=createdAt:desc`;

  const startTime = Date.now();
  const res = http.get(url, { headers: DEFAULT_HEADERS });
  const duration = Date.now() - startTime;

  customMetrics.searchDuration.add(duration);
  const success = assertSuccessResponse(res, 200);
  customMetrics.errorRate.add(!success);

  return res;
}

export default function () {
  runSearchScenario();
}
