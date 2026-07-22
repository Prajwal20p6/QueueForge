/**
 * @fileoverview K6 Delivery Processing Scenario
 * Simulates ingestion followed by status polling for completion.
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, DEFAULT_HEADERS } from '../lib/config.js';
import { generateTaskResultPayload } from '../lib/utils.js';
import { customMetrics } from '../lib/metrics.js';

export function runDeliveryScenario() {
  const body = JSON.stringify(generateTaskResultPayload(2));
  const ingestRes = http.post(`${BASE_URL}/api/v1/results`, body, { headers: DEFAULT_HEADERS });

  if (ingestRes.status === 201) {
    try {
      const data = JSON.parse(ingestRes.body);
      const resultId = data.resultId || data.id;

      if (resultId) {
        sleep(0.5);
        const pollRes = http.get(`${BASE_URL}/api/v1/results/${resultId}/deliveries`, { headers: DEFAULT_HEADERS });
        if (pollRes.status === 200) {
          customMetrics.successfulDeliveries.add(1);
        } else {
          customMetrics.failedDeliveries.add(1);
        }
      }
    } catch (e) {
      customMetrics.failedDeliveries.add(1);
    }
  }
}

export default function () {
  runDeliveryScenario();
}
