import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  stages: [
    { duration: '30s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 250 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 350 },
    { duration: '30s', target: 400 },
    { duration: '30s', target: 450 },
    { duration: '30s', target: 500 },
  ],
};

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'stress@load.com',
    agentId: 'stress-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { content: 'stress limits checks' },
    confidenceScore: 0.90,
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

  sleep(0.02);
}
