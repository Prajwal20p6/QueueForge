/**
 * @fileoverview K6 Custom Metrics Definitions
 * Defines custom trend, counter, and rate metrics for QueueForge load testing.
 */

import { Counter, Rate, Trend } from 'k6/metrics';

export const customMetrics = {
  ingestDuration: new Trend('queueforge_ingest_duration_ms'),
  deliveryDuration: new Trend('queueforge_delivery_duration_ms'),
  searchDuration: new Trend('queueforge_search_duration_ms'),
  successfulDeliveries: new Counter('queueforge_successful_deliveries_total'),
  failedDeliveries: new Counter('queueforge_failed_deliveries_total'),
  errorRate: new Rate('queueforge_error_rate'),
};
