import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  scenarios: {
    constant_soak_rate: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '2h',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
};

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'soak@load.com',
    agentId: 'soak-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { metrics: 'soak metrics' },
    confidenceScore: 0.98,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-api-key-secret-min-32-characters-long',
    },
  };

  const res = http.post(url, payload, params);
  resultIngestionTime.add(res.timings.duration);

  check(res, {
    'is status 202': (r) => r.status === 202,
  });
}
