/**
 * @fileoverview K6 Admin Operations Scenario
 * Tests admin dashboard metrics, health queries, worker status, and audit logs.
 */

import http from 'k6/http';
import { BASE_URL, DEFAULT_HEADERS } from '../lib/config.js';
import { assertSuccessResponse } from '../lib/assertions.js';

export function runAdminScenario() {
  const endpoints = [
    '/admin/dashboard',
    '/admin/workers',
    '/admin/config',
    '/admin/audit-logs',
    '/admin/analytics',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, { headers: DEFAULT_HEADERS });
  assertSuccessResponse(res, 200);

  return res;
}

export default function () {
  runAdminScenario();
}
