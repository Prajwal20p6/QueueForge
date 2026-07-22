import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  duration: '30m',
  vus: 30,
};

export default function () {
  const rand = Math.random();

  if (rand < 0.70) {
    // 70% Ingestion
    const url = 'http://localhost:3000/v1/results';
    const payload = JSON.stringify({
      emailId: 'capacity@load.com',
      agentId: 'capacity-agent',
      agentVersion: 'v1.0.0',
      resultPayload: { info: 'capacity planning metadata' },
      confidenceScore: 0.99,
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-secret-min-32-characters-long',
      },
    };
    const res = http.post(url, payload, params);
    resultIngestionTime.add(res.timings.duration);
    check(res, { 'is status 202': (r) => r.status === 202 });
  } else if (rand < 0.85) {
    // 15% Lineage queries
    const url = 'http://localhost:3000/v1/lineage/capacity@load.com';
    const params = {
      headers: {
        'Authorization': 'Bearer test-jwt-token-value',
      },
    };
    const res = http.get(url, params);
    check(res, { 'is status 200': (r) => r.status === 200 });
  } else {
    // Other actions
    const url = 'http://localhost:3000/health';
    const res = http.get(url);
    check(res, { 'is status 200': (r) => r.status === 200 });
  }

  sleep(0.1);
}
