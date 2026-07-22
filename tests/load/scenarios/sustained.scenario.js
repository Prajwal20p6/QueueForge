import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 300,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
};

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'sustained@load.com',
    agentId: 'sustained-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { data: 'sustained loading' },
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

  check(res, {
    'is status 202': (r) => r.status === 202,
  });
}
