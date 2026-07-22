/**
 * @fileoverview K6 Assertion Helpers
 * Helper functions for response validation and threshold assertions.
 */

import { check } from 'k6';

export function assertSuccessResponse(res, expectedStatus = 200) {
  return check(res, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response body is non-empty': (r) => r.body && r.body.length > 0,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
}

export function assertIngestResponse(res) {
  return check(res, {
    'status is 201 Created': (r) => r.status === 201,
    'has resultId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body.resultId || body.id);
      } catch (e) {
        return false;
      }
    },
    'latency under 1000ms': (r) => r.timings.duration < 1000,
  });
}
