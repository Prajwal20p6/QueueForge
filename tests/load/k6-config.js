import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metric declarations
export const resultIngestionTime = new Trend('result_ingestion_time');
export const deliverySuccessRate = new Rate('delivery_success_rate');
export const retryCount = new Counter('retry_count');

export const baseConfig = {
  insecureSkipTLSVerify: true,
  thresholds: {
    http_req_duration: ['p(95)<5000'], // P95 latency must be under 5s
    http_req_failed: ['rate<0.01'],    // error rate must be under 1%
    result_ingestion_time: ['p(95)<200'], // ingestion P95 must be under 200ms
  },
};
