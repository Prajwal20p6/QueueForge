import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  stages: [
    { duration: '30s', target: 50 },   // baseline
    { duration: '10s', target: 1000 }, // sudden spike
    { duration: '30s', target: 1000 }, // maintain spike
    { duration: '10s', target: 50 },   // cool down
    { duration: '30s', target: 50 },
  ],
};

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'spike@load.com',
    agentId: 'spike-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { info: 'spike test data' },
    confidenceScore: 0.95,
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

  sleep(0.05);
}
