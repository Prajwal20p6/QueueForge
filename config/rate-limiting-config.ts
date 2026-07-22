/**
 * Rates limiters limits parameters values.
 */
export const rateLimitingConfig = {
  globalRateLimit: 10000,
  apiKeyRateLimit: 1000,
  ipRateLimit: 100,
  burstCapacity: 50,
};
export { rateLimitingConfig as limitConfig };
