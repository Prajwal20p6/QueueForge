export * from './redis.config';
export { loadRedisConfig as getRedisConfig } from './redis.config';
export const DEFAULT_REDIS_HOST = 'localhost';
export const DEFAULT_REDIS_PORT = 6379;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_TIMEOUT_MS = 10000;
export const DEFAULT_REDIS_IDLE_TIMEOUT_MS = 30000;
export const DEFAULT_REDIS_MAX_RETRIES = 10;
export const DEFAULT_REDIS_RETRY_DELAY_MS = 1500;
