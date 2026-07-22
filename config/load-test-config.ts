/**
 * Configuration schema setting targets host URL and API keys parameters.
 */
export const loadTestConfig = {
  targetUrl: process.env.LOAD_TEST_TARGET_URL ?? 'http://localhost:3000',
  apiKey: process.env.LOAD_TEST_API_KEY ?? 'test-api-key-secret-min-32-characters-long',
  thresholds: {
    maxP95LatencyMs: 5000,
    maxErrorRatePercent: 1.0,
  },
};
