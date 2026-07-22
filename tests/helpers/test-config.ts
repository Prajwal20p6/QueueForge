export interface TestConfig {
  database: { url: string };
  redis: { host: string; port: number; password?: string };
  queue: { prefix: string; defaultJobDelay: number };
  api: { port: number; host: string };
  secrets: { jwtSecret: string; apiKeyPrefix: string };
  timeouts: { defaultTimeoutMs: number; integrationTimeoutMs: number };
  features: { enableMetrics: boolean; enableTracing: boolean };
}

/**
 * Returns strongly typed testing configuration parameters.
 */
export function getTestConfig(): TestConfig {
  return {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/queueforge_test',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    queue: {
      prefix: 'queueforge_test',
      defaultJobDelay: 100,
    },
    api: {
      port: 0,
      host: '127.0.0.1',
    },
    secrets: {
      jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkeyforqueueforgetesting123',
      apiKeyPrefix: 'qf_test_',
    },
    timeouts: {
      defaultTimeoutMs: 5000,
      integrationTimeoutMs: 15000,
    },
    features: {
      enableMetrics: true,
      enableTracing: false,
    },
  };
}
