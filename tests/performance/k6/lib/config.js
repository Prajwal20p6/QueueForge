/**
 * @fileoverview K6 Load Test Configuration Module
 * Exports environment base URLs, headers, default thresholds, and authentication helpers.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_KEY = __ENV.API_KEY || 'qf_test_api_key_12345';
export const JWT_TOKEN = __ENV.JWT_TOKEN || 'bearer_token_mock';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Key': API_KEY,
};

export const SLO_THRESHOLDS = {
  http_req_duration: ['p(95)<5000', 'p(99)<10000'], // P95 < 5s SLO, P99 < 10s
  http_req_failed: ['rate<0.0005'],               // Error rate < 0.05% SLO
  http_reqs: ['rate>100'],                        // Minimum throughput requirement
};

export const STRICT_SLO_THRESHOLDS = {
  http_req_duration: ['p(95)<3000', 'p(99)<5000'],  // P95 < 3s for soak/endurance
  http_req_failed: ['rate<0.0001'],               // Error rate < 0.01%
};
