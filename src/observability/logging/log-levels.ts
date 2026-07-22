/**
 * Supported logging levels enums.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Returns standard LogLevel matched to deployment environments.
 * @param env - Deployment environment name
 */
export function getLogLevel(env: string): LogLevel {
  const cleanEnv = (env || '').trim().toLowerCase();
  if (cleanEnv === 'development' || cleanEnv === 'dev' || cleanEnv === 'local') {
    return LogLevel.DEBUG;
  }
  if (cleanEnv === 'test') {
    return LogLevel.WARN;
  }
  return LogLevel.INFO;
}
