import { Config } from '../../src/config';

/**
 * Complete test configuration matching the Config interface.
 * Uses dummy secrets, in-memory-safe limits, and disabled daemons for test isolation.
 */
export const TEST_CONFIG: Config = {
  app: {
    name: 'QueueForge',
    version: '1.0.0',
    environment: 'test',
    nodeEnv: 'test',
    port: 3001,
    hostname: 'localhost',
  },
  database: {
    url: process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/queueforge_test?schema=public',
    poolMin: 1,
    poolMax: 3,
    connectionTimeoutMs: 5000,
    queryTimeoutMs: 5000,
    idleTimeoutMs: 10000,
    logQueries: false,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    host: process.env.REDIS_HOST ?? 'localhost',
    port: 6379,
    db: 1, // Use DB 1 for tests to avoid colliding with dev DB 0
    poolMin: 1,
    poolMax: 3,
    connectTimeoutMs: 3000,
    commandTimeoutMs: 3000,
    keyPrefix: 'qf-test:',
    enableOfflineQueue: false,
  },
  queue: {
    name: 'queueforge-test',
    dlqName: 'queueforge-test-dlq',
    delayedQueueName: 'queueforge-test-delayed',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 100 },
      removeOnComplete: 10,
      removeOnFail: 10,
    },
    concurrency: 2,
    pollIntervalMs: 100,
  },
  security: {
    jwtSecret: 'test-jwt-secret-min-32-characters-long-abc',
    jwtExpirySeconds: 3600,
    apiKeySecret: 'test-api-key-secret-min-32-characters-long',
    hmacSecret: 'test-hmac-secret-min-32-characters-long-abc',
    rateLimitRequestsPerMinute: 10000,
    rateLimitWindowMs: 60000,
    bcryptRounds: 1, // minimal for test speed
    allowedOrigins: ['http://localhost:3001'],
  },
  observability: {
    logLevel: 'error',
    tracingEnabled: false,
    metricsEnabled: false,
    serviceName: 'queueforge-test',
    jaegerServiceName: 'queueforge-test',
    traceExporterUrl: 'http://localhost:4317',
    samplingRate: 0.0,
    prometheusPort: 9091, // Different port to avoid conflict
    enableAuditLogging: false,
    auditLogRetentionDays: 7,
  },
  resilience: {
    circuitBreaker: {
      timeout: 1000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
      volumeThreshold: 5,
      halfOpenRequests: 1,
      httpStatusCodesToOpen: [500, 502, 503, 504],
    },
    bulkhead: {
      maxConcurrent: 5,
      maxWait: 500,
    },
    backpressure: {
      maxQueueDepth: 100,
      highWatermark: 0.8,
      lowWatermark: 0.5,
    },
    retry: {
      maxRetries: 3,
      baseBackoffMs: 100,
      maxBackoffMs: 1000,
      jitterFactor: 0.1,
    },
  },
  worker: {
    concurrency: 2,
    pollIntervalMs: 100,
    staleJobTimeoutMs: 5000,
    heartbeatIntervalMs: 2000,
    shutdownTimeoutMs: 2000,
    startWorker: false,
  },
  daemon: {
    startDaemon: false,
    checkIntervalMs: 1000,
    shutdownTimeoutMs: 2000,
  },
} as unknown as Config;
