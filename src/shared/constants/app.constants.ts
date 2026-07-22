export const APP_NAME = 'QueueForge';
export const VERSION = '1.0.0';
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
