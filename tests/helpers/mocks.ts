import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { Logger } from '../../src/observability/logging/logger';
import { AuthGuard } from '../../src/security/auth/auth-guard';
import { HmacSigner } from '../../src/security/hmac/signer';
import { MetricsRegistry } from '../../src/observability/metrics/metrics-registry';
import { Tracer } from '../../src/observability/tracing/tracer';

/**
 * Factory class providing fully-mocked implementations of all external QueueForge dependencies.
 * All returned mocks are jest.fn() based with sensible default return values.
 *
 * @example
 * ```typescript
 * const logger = MockFactory.createMockLogger();
 * const prisma = MockFactory.createMockPrismaClient();
 * ```
 */
export class MockFactory {
  /**
   * Creates a mocked PrismaClient with commonly used model methods stubbed.
   */
  public static createMockPrismaClient(): jest.Mocked<PrismaClient> {
    const modelProxy = () => ({
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _avg: {}, _count: {}, _max: {}, _min: {}, _sum: {} }),
    });

    return {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $executeRaw: jest.fn().mockResolvedValue(0),
      $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          aiTaskResult: modelProxy(),
          taskResultDelivery: modelProxy(),
          destination: modelProxy(),
          attemptLog: modelProxy(),
          auditLog: modelProxy(),
        })
      ),
      aiTaskResult: modelProxy() as any,
      taskResultDelivery: modelProxy() as any,
      destination: modelProxy() as any,
      attemptLog: modelProxy() as any,
      auditLog: modelProxy() as any,
    } as unknown as jest.Mocked<PrismaClient>;
  }

  /**
   * Creates a mocked ioredis Redis client with core commands stubbed.
   */
  public static createMockRedisClient(): jest.Mocked<Redis> {
    const store = new Map<string, string>();
    return {
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn().mockImplementation(async (k: string) => store.get(k) ?? null),
      set: jest.fn().mockImplementation(async (k: string, v: string) => { store.set(k, v); return 'OK'; }),
      setex: jest.fn().mockImplementation(async (k: string, _: number, v: string) => { store.set(k, v); return 'OK'; }),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      keys: jest.fn().mockResolvedValue([]),
      flushdb: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      defineCommand: jest.fn(),
      zadd: jest.fn().mockResolvedValue(1),
      zrem: jest.fn().mockResolvedValue(1),
      zcard: jest.fn().mockResolvedValue(0),
      zrange: jest.fn().mockResolvedValue([]),
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      info: jest.fn().mockResolvedValue('connected_clients:1\r\n'),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      status: 'ready',
      options: { host: 'localhost', port: 6379, db: 0 },
      pipeline: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        zadd: jest.fn().mockReturnThis(),
        zremrangebyscore: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        exists: jest.fn().mockReturnThis(),
      }),
    } as unknown as jest.Mocked<Redis>;
  }

  /**
   * Creates a mocked BullMQ Queue with job lifecycle methods stubbed.
   */
  public static createMockQueue(): jest.Mocked<Queue> {
    return {
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id', data: {} }),
      addBulk: jest.fn().mockResolvedValue([]),
      getJob: jest.fn().mockResolvedValue(null),
      getJobs: jest.fn().mockResolvedValue([]),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 }),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      drain: jest.fn().mockResolvedValue(undefined),
      obliterate: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      name: 'mock-queue',
      opts: {},
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Queue>;
  }

  /**
   * Creates a mocked Logger with all log level methods stubbed.
   */
  public static createMockLogger(): jest.Mocked<Logger> {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;
  }

  /**
   * Creates a mocked AuthGuard that always authenticates successfully.
   */
  public static createMockAuthGuard(): jest.Mocked<AuthGuard> {
    return {
      authenticate: jest.fn().mockResolvedValue({
        sub: 'test-user-id',
        scopes: ['read', 'write'],
        type: 'jwt',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
      authorize: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AuthGuard>;
  }

  /**
   * Creates a mocked HmacSigner with sign and verify methods stubbed.
   */
  public static createMockHmacSigner(): jest.Mocked<HmacSigner> {
    return {
      sign: jest.fn().mockReturnValue('mock-hmac-signature-abc123'),
      verify: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<HmacSigner>;
  }

  /**
   * Creates a mocked MetricsRegistry with OTel meter methods stubbed.
   */
  public static createMockMetricsRegistry(): jest.Mocked<MetricsRegistry> {
    const mockCounter = { add: jest.fn() };
    const mockHistogram = { record: jest.fn() };
    const mockGauge = { record: jest.fn() };

    return {
      initialize: jest.fn().mockResolvedValue(undefined),
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue(mockCounter),
        createHistogram: jest.fn().mockReturnValue(mockHistogram),
        createObservableGauge: jest.fn().mockReturnValue(mockGauge),
        createUpDownCounter: jest.fn().mockReturnValue(mockCounter),
      }),
      getContentType: jest.fn().mockReturnValue('text/plain; version=0.0.4; charset=utf-8'),
      getMetrics: jest.fn().mockResolvedValue('# HELP queueforge_test\n# TYPE queueforge_test counter\n'),
    } as unknown as jest.Mocked<MetricsRegistry>;
  }

  /**
   * Creates a mocked Tracer wrapping a no-op OpenTelemetry tracer.
   */
  public static createMockTracer(): jest.Mocked<Tracer> {
    const mockSpan = {
      end: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      addEvent: jest.fn(),
      isRecording: jest.fn().mockReturnValue(false),
      spanContext: jest.fn().mockReturnValue({ traceId: 'mock-trace-id', spanId: 'mock-span-id', traceFlags: 1 }),
    };
    return {
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      getTracer: jest.fn().mockReturnValue({
        startSpan: jest.fn().mockReturnValue(mockSpan),
        startActiveSpan: jest.fn().mockImplementation((_name: string, fn: (span: unknown) => unknown) => fn(mockSpan)),
      }),
      getTraceId: jest.fn().mockReturnValue('mock-trace-id-00000000000000000000000000000001'),
    } as unknown as jest.Mocked<Tracer>;
  }
}
