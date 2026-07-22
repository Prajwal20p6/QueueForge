import { loadAppConfig, AppConfig } from './app.config';
import { loadDatabaseConfig, DatabaseConfig } from './database.config';
import { loadRedisConfig, RedisConfig } from './redis.config';
import { loadQueueConfig, QueueConfig } from './queue.config';
import { loadObservabilityConfig, ObservabilityConfig } from './observability.config';
import { loadSecurityConfig, SecurityConfig } from './security.config';
import { loadResilienceConfig, ResilienceConfig } from './resilience.config';
import { loadApiConfig, ApiConfig } from './api.config';
import { loadServerConfig, ServerConfig } from './server.config';
import { loadAdminConfig, AdminConfig } from './admin.config';
import { loadRateLimitingConfig, RateLimitingConfig } from './rate-limiting.config';
import { loadWorkerConfig, WorkerConfig } from './worker.config';
import { loadDaemonConfig, DaemonConfig } from './daemon.config';
import { parseEnv } from './env';
import { formatJSON } from '../shared/utils/formatting';
import { isProduction } from './environment';
import { ValidationError } from '../shared/errors/validation-error';

export * from './env';
export * from './environment';
export * from './app.config';
export * from './database.config';
export * from './redis.config';
export * from './queue.config';
export * from './observability.config';
export * from './security.config';
export * from './resilience.config';
export * from './api.config';
export * from './server.config';
export * from './admin.config';
export * from './rate-limiting.config';
export * from './worker.config';
export * from './daemon.config';

/**
 * Unified Config schema wrapping all sub-configurations
 */
export interface Config {
  readonly app: AppConfig;
  readonly database: DatabaseConfig;
  readonly queue: QueueConfig;
  readonly redis: RedisConfig;
  readonly observability: ObservabilityConfig;
  readonly security: SecurityConfig;
  readonly resilience: ResilienceConfig;
  readonly api: ApiConfig;
  readonly server: ServerConfig;
  readonly admin: AdminConfig;
  readonly rateLimiting: RateLimitingConfig;
  readonly worker: WorkerConfig;
  readonly daemon: DaemonConfig;
}

let config: Config | null = null;

/**
 * Utility to scrub secrets before logging configurations on startup
 */
function redactSensitiveData(envObj: Record<string, any>): Record<string, any> {
  const redacted: Record<string, any> = {};
  const sensitivePatterns = ['secret', 'key', 'password', 'url', 'token'];

  for (const key of Object.keys(envObj)) {
    const isSensitive = sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern));
    if (isSensitive && envObj[key]) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = envObj[key];
    }
  }

  return redacted;
}

/**
 * Performs cross-config consistency checks to prevent thread starvation or pool conflicts
 */
function validateConfigConsistency(c: Config): void {
  if (c.database.minConnections > c.database.maxConnections) {
    throw new ValidationError('Database pool minConnections cannot exceed maxConnections');
  }
  if (c.redis.poolMin > c.redis.poolMax) {
    throw new ValidationError('Redis poolMin cannot exceed poolMax');
  }
  if (c.database.maxConnections < c.resilience.bulkheadPoolSizeDatabase) {
    throw new ValidationError(
      `Inconsistent configuration: database pool max (${c.database.maxConnections}) must be greater than or equal to database bulkhead pool size (${c.resilience.bulkheadPoolSizeDatabase})`
    );
  }

  // Production checks
  if (isProduction()) {
    if (!c.database.enableSSL) {
      throw new ValidationError('Production configuration must have database SSL enabled');
    }
    if (!c.redis.enableTls) {
      throw new ValidationError('Production configuration must have Redis TLS enabled');
    }
    if (!c.server.https.enabled) {
      throw new ValidationError('Production configuration must have HTTPS server enabled');
    }
    const secrets = [c.security.jwtSecret, c.security.apiKeySecret, c.security.hmacSecret];
    const hasDummy = secrets.some(
      (secret) =>
        secret.includes('test') ||
        secret.includes('dummy') ||
        secret.includes('your-') ||
        secret.includes('super-secret')
    );
    if (hasDummy) {
      throw new ValidationError('Production configuration cannot use test or dummy secrets keys');
    }
  }
}

/**
 * Synchronously loads and freezes the entire configuration graph from env
 */
export function loadConfigSync(): Config {
  if (config) {
    return config;
  }

  // Pre-load EnvLoader
  parseEnv();

  const app = loadAppConfig();
  const database = loadDatabaseConfig();
  const redis = loadRedisConfig();
  const queue = loadQueueConfig();
  const observability = loadObservabilityConfig();
  const security = loadSecurityConfig();
  const resilience = loadResilienceConfig();
  const api = loadApiConfig();
  const server = loadServerConfig();
  const admin = loadAdminConfig();
  const rateLimiting = loadRateLimitingConfig();
  const worker = loadWorkerConfig();
  const daemon = loadDaemonConfig();

  const loadedConfig: Config = {
    app,
    database,
    queue,
    redis,
    observability,
    security,
    resilience,
    api,
    server,
    admin,
    rateLimiting,
    worker,
    daemon,
  };

  validateConfigConsistency(loadedConfig);

  config = Object.freeze(loadedConfig);
  return config;
}

/**
 * Asynchronously loads all configuration parameters sequentially, checks consistency,
 * logs startup properties with redacted secrets, and caches the resulting singleton.
 * @returns Frozen Config object
 */
export async function loadConfig(): Promise<Config> {
  if (config) {
    return config;
  }

  const loaded = loadConfigSync();

  // Log parsed environment configurations with sensitive data redacted
  const rawEnv = parseEnv();
  const redactedEnv = redactSensitiveData(rawEnv);
  process.stdout.write(
    `QueueForge startup configuration parsed and validated:\n${formatJSON(redactedEnv)}\n`
  );

  return loaded;
}

/**
 * Asynchronously loads, logs, and validates all application configurations with proper error trapping.
 * Fails fast by throwing an error on validation failure.
 * @returns Frozen Config object
 */
export async function initializeConfig(): Promise<Config> {
  try {
    return await loadConfig();
  } catch (err: any) {
    process.stderr.write(`Configuration initialization failed: ${err.message}\n`);
    throw err;
  }
}

/**
 * Accesses the global loaded configuration singleton.
 * If not already loaded, lazy-loads it synchronously.
 * @returns Frozen Config object
 */
export function getConfig(): Config {
  if (!config) {
    return loadConfigSync();
  }
  return config;
}

/**
 * Resets the config cache singleton, primarily used for isolating test suites runs.
 */
export function resetConfig(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config as any) = null;
}
export { loadConfig as getConfiguration };
export { getConfig as getConfigRegistry };
