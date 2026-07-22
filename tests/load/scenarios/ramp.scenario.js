import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  stages: [
    { duration: '1m', target: 50 },  // 0 -> 50 jobs/sec
    { duration: '1m30s', target: 200 }, // 50 -> 200 jobs/sec
    { duration: '2m30s', target: 500 }, // 200 -> 500 jobs/sec
  ],
};

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'test@load.com',
    agentId: 'ramp-load-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { text: 'ramp test data' },
    confidenceScore: Math.random(),
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

  sleep(0.1);
}
