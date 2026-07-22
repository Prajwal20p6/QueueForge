import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseConfig, resultIngestionTime } from '../k6-config.js';

export const options = {
  ...baseConfig,
  vus: 10,
  duration: '1m',
};

// Generates 100KB payload size
const largePayload = 'X'.repeat(100 * 1024);

export default function () {
  const url = 'http://localhost:3000/v1/results';
  const payload = JSON.stringify({
    emailId: 'edgecase@load.com',
    agentId: 'large-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { content: largePayload },
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

  sleep(0.5);
}
